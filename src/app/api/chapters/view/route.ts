import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// API to increment chapter view count
export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id"); // Get chapter ID from query param

        if (!id) {
            return NextResponse.json(
                { error: "Chapter ID is required" },
                { status: 400 }
            );
        }

        // Use service role key to bypass RLS for this internal update
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Option 1: Use a database function (RPC) for atomic increment (Recommended)
        const { error: rpcError } = await supabase.rpc('increment_chapter_view_count', {
            chapter_id: id
        });

        if (!rpcError) {
            // RPC succeeded
            return NextResponse.json({ success: true });
        } else {
            // RPC failed (maybe function doesn't exist or other error)
            console.error("Error incrementing chapter view count via RPC:", rpcError);
            console.log("Falling back to manual view count update for chapter:", id);

            // Option 2: Fallback to manual fetch and update (Less safe due to potential race conditions)
            // 1. Fetch current view count
            const { data: chapterData, error: getError } = await supabase
                .from("chapters")
                .select("view_count")
                .eq("id", id)
                .single();

            if (getError || !chapterData) {
                console.error("Error fetching chapter for manual update:", getError);
                // If chapter not found due to RPC error, return 404
                if (rpcError.message.includes("relation \"chapters\" does not exist") || getError?.code === 'PGRST116') {
                     return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
                }
                return NextResponse.json({ error: "Failed to fetch chapter data" }, { status: 500 });
            }

            const currentViewCount = chapterData.view_count || 0;

            // 2. Increment view count
            const { error: updateError } = await supabase
                .from("chapters")
                .update({ view_count: currentViewCount + 1 })
                .eq("id", id);

            if (updateError) {
                console.error("Error during manual chapter view count update:", updateError);
                return NextResponse.json(
                    { error: "Error updating view count", details: updateError.message },
                    { status: 500 }
                );
            }

            // Manual update succeeded
            return NextResponse.json({ success: true });
        }

    } catch (error: any) {
        console.error("API Error (Chapters View POST):", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
} 