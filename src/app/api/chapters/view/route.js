import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// API para incrementar visualizações de capítulos
export async function POST(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID do capítulo não fornecido" },
                { status: 400 }
            );
        }

        // Usar service role key para contornar RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Primeiro, verificar se o capítulo existe
        const { data: chapter, error: getError } = await supabase
            .from("chapters")
            .select("view_count")
            .eq("id", id)
            .single();

        if (getError) {
            console.error("Erro ao buscar capítulo:", getError);
            return NextResponse.json(
                { error: "Capítulo não encontrado" },
                { status: 404 }
            );
        }

        // Incrementar visualizações usando view_count que sabemos que existe
        const { error: updateError } = await supabase
            .from("chapters")
            .update({ view_count: (chapter.view_count || 0) + 1 })
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
        console.error("Erro na API de visualização de capítulos:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
} 