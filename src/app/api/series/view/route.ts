import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// API para incrementar visualizações de séries
export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Series ID is required" }, // Mensagem em inglês para consistência de API
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Tentar usar a função RPC 'increment_series_view_count'
        const { error: rpcError } = await supabase.rpc('increment_series_view_count', {
            series_id: id
        });

        if (rpcError) {
            console.error("Error incrementing view count via RPC:", rpcError);
            // Fallback para atualização manual se RPC falhar
            console.log("Falling back to manual view count update for series:", id);

            // 1. Obter o valor atual
            const { data: seriesData, error: getError } = await supabase
                .from("series")
                .select("view_count")
                .eq("id", id)
                .single();

            if (getError || !seriesData) {
                console.error("Error fetching series for manual update:", getError);
                return NextResponse.json(
                    { error: "Series not found" },
                    { status: 404 }
                );
            }

            const currentViewCount = seriesData.view_count || 0;

            // 2. Incrementar visualizações
            const { error: updateError } = await supabase
                .from("series")
                .update({ view_count: currentViewCount + 1 })
                .eq("id", id);

            if (updateError) {
                console.error("Error during manual view count update:", updateError);
                return NextResponse.json(
                    { error: "Error updating view count", details: updateError.message },
                    { status: 500 }
                );
            }
        }

        // Se RPC ou fallback manual funcionou
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API Error (Series View POST):", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
} 