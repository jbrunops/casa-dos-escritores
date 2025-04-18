import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Funções auxiliares para API de séries
export async function GET(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (id) {
            // Buscar série específica com seus capítulos
            console.log("API: Buscando série com ID:", id);
            const { data: series, error: seriesError } = await supabase
                .from("series")
                .select(
                    `
                    *,
                    profiles(username, avatar_url)
                `
                )
                .eq("id", id)
                .single();

            if (seriesError) {
                console.error("API: Erro ao buscar série:", seriesError);
                return NextResponse.json(
                    { error: "Série não encontrada" },
                    { status: 404 }
                );
            }

            // Buscar capítulos separadamente
            const { data: chapters, error: chaptersError } = await supabase
                .from("chapters")
                .select("id, title, created_at, chapter_number, view_count")
                .eq("series_id", id)
                .order("chapter_number", { ascending: true });

            if (chaptersError) {
                console.error("API: Erro ao buscar capítulos:", chaptersError);
            }

            // Adicionar capítulos à resposta
            series.chapters = chapters || [];
            console.log(
                "API: Encontrados",
                series.chapters.length,
                "capítulos"
            );

            // Incrementar visualizações
            await supabase
                .from("series")
                .update({ view_count: (series.view_count || 0) + 1 })
                .eq("id", id);

            return NextResponse.json({ series });
        } else {
            // Listar todas as séries
            const { data: series, error } = await supabase
                .from("series")
                .select(
                    `
                    *,
                    profiles(username)
                `
                )
                .order("created_at", { ascending: false });

            if (error) {
                console.error("API: Erro ao listar séries:", error);
                return NextResponse.json(
                    { error: "Erro ao buscar séries" },
                    { status: 500 }
                );
            }

            return NextResponse.json({ series });
        }
    } catch (error) {
        console.error("Erro na API de séries:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { title, description, genre, tags, authorId, coverUrl } =
            await request.json();

        // Validação básica
        if (!title || !authorId) {
            return NextResponse.json(
                { error: "Campos obrigatórios ausentes" },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Criar nova série
        const { data, error } = await supabase
            .from("series")
            .insert({
                title,
                description,
                genre,
                tags,
                author_id: authorId,
                cover_url: coverUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error("Erro ao criar série:", error);
            return NextResponse.json(
                { error: "Falha ao criar série" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            series: data[0],
        });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
