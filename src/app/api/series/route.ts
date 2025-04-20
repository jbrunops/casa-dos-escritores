import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Define interfaces for data structures
interface Profile {
    username: string;
    avatar_url?: string;
}

interface Chapter {
    id: string;
    title: string;
    created_at: string;
    chapter_number: number;
    view_count: number;
}

interface Series {
    id?: string; // Optional for inserts
    title: string;
    description?: string;
    genre?: string;
    tags?: string[];
    author_id: string;
    cover_url?: string;
    created_at?: string;
    updated_at?: string;
    view_count?: number;
    profiles: Profile | null;
    chapters?: Chapter[]; // Make chapters optional
}

// GET Handler
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (id) {
            // Fetch specific series with profile
            console.log("API: Fetching series with ID:", id);
            const { data: seriesData, error: seriesError } = await supabase
                .from("series")
                .select(
                    `
                    *,
                    profiles(username, avatar_url)
                `
                )
                .eq("id", id)
                .single();

            if (seriesError || !seriesData) {
                console.error("API: Error fetching series:", seriesError);
                return NextResponse.json(
                    { error: "Series not found" },
                    { status: 404 }
                );
            }

            // Fetch chapters separately
            const { data: chaptersData, error: chaptersError } = await supabase
                .from("chapters")
                .select("id, title, created_at, chapter_number, view_count")
                .eq("series_id", id)
                .order("chapter_number", { ascending: true });

            if (chaptersError) {
                console.error("API: Error fetching chapters:", chaptersError);
                // Continue even if chapters fail to load, but log the error
            }

            // Add chapters to the response
            const series: Series = seriesData as Series; // Type assertion
            series.chapters = (chaptersData as Chapter[]) || [];
            console.log(
                "API: Found",
                series.chapters.length,
                "chapters"
            );

            // Increment view count (using Supabase helper)
            try {
                await supabase.rpc('increment_series_view_count', { series_id: id })
            } catch (rpcError) {
                 console.error("API: Error incrementing view count:", rpcError);
                // Fallback to manual update if RPC fails or doesn't exist
                if (series.view_count !== undefined) {
                     await supabase
                        .from("series")
                        .update({ view_count: series.view_count + 1 })
                        .eq("id", id);
                }
            }

            return NextResponse.json({ series });
        } else {
            // List all series
            const { data: seriesList, error } = await supabase
                .from("series")
                .select(
                    `
                    *,
                    profiles(username)
                `
                )
                .order("created_at", { ascending: false });

            if (error) {
                console.error("API: Error listing series:", error);
                return NextResponse.json(
                    { error: "Error fetching series" },
                    { status: 500 }
                );
            }

            return NextResponse.json({ series: seriesList as Series[] });
        }
    } catch (error: any) {
        console.error("API Error (Series GET):", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

// POST Handler
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            genre,
            tags,
            authorId,
            coverUrl,
        }: { // Define type for request body
            title: string;
            description?: string;
            genre?: string;
            tags?: string[];
            authorId: string;
            coverUrl?: string;
        } = body;

        // Basic validation
        if (!title || !authorId) {
            return NextResponse.json(
                { error: "Missing required fields (title, authorId)" },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Create new series
        const { data, error } = await supabase
            .from("series")
            .insert({
                title,
                description,
                genre,
                tags,
                author_id: authorId,
                cover_url: coverUrl,
                // created_at and updated_at are usually handled by DB defaults
            })
            .select()
            .single(); // Expecting a single object back

        if (error) {
            console.error("Error creating series:", error);
            return NextResponse.json(
                { error: "Failed to create series", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            series: data as Series, // Type assertion
        }, { status: 201 });
    } catch (error: any) {
        console.error("API Error (Series POST):", error);
        // Check for JSON parsing error
        if (error instanceof SyntaxError) {
             return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
} 