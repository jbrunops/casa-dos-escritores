import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// API para incrementar visualizações de séries
export async function POST(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID da série não fornecido" },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Primeiro, obtenha o valor atual de view_count
        const { data: series, error: getError } = await supabase
            .from("series")
            .select("view_count")
            .eq("id", id)
            .single();

        if (getError) {
            console.error("Erro ao buscar série para atualizar visualizações:", getError);
            return NextResponse.json(
                { error: "Série não encontrada" },
                { status: 404 }
            );
        }

        // Incrementar visualizações
        const { error: updateError } = await supabase
            .from("series")
            .update({ view_count: (series.view_count || 0) + 1 })
            .eq("id", id);

        if (updateError) {
            console.error("Erro ao atualizar visualizações:", updateError);
            return NextResponse.json(
                { error: "Erro ao atualizar visualizações" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro na API de visualização de séries:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
} 