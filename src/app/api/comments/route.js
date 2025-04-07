import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sanitizeText, isValidUUID } from "@/lib/utils";

export async function POST(request) {
    try {
        // Verificar cabeçalhos e origem 
        const origin = request.headers.get('origin') || '';
        const allowedOrigins = [
            process.env.NEXT_PUBLIC_SITE_URL || '',
            'http://localhost:3000',
            'http://localhost:3001'
        ].filter(Boolean);
        
        // Verificar se a origem está permitida (em produção)
        if (process.env.NODE_ENV === 'production' && !allowedOrigins.includes(origin)) {
            console.error(`Requisição de origem não permitida: ${origin}`);
            return NextResponse.json(
                { error: "Acesso negado" },
                { status: 403 }
            );
        }

        // Criar cliente supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Obter dados da requisição
        const { text, authorId, storyId, seriesId, chapterId, parentId } = await request.json();

        // Sanitização básica para evitar XSS
        const sanitizedText = sanitizeText(text);

        // Verificar campos obrigatórios
        if (!sanitizedText || !sanitizedText.trim()) {
            return NextResponse.json(
                { error: "O texto do comentário é obrigatório" },
                { status: 400 }
            );
        }

        if (!authorId || !isValidUUID(authorId)) {
            return NextResponse.json(
                { error: "ID do autor inválido" },
                { status: 400 }
            );
        }

        // É necessário ter ou storyId ou seriesId ou chapterId
        if (!storyId && !seriesId && !chapterId) {
            return NextResponse.json(
                { error: "É necessário especificar storyId, seriesId ou chapterId" },
                { status: 400 }
            );
        }

        // Validar UUIDs
        if ((storyId && !isValidUUID(storyId)) || 
            (seriesId && !isValidUUID(seriesId)) || 
            (chapterId && !isValidUUID(chapterId)) || 
            (parentId && !isValidUUID(parentId))) {
            return NextResponse.json(
                { error: "Um ou mais IDs fornecidos são inválidos" },
                { status: 400 }
            );
        }

        // Verificar se o usuário existe
        const { data: userExists, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", authorId)
            .single();

        if (userError || !userExists) {
            console.error("Erro ao verificar usuário:", userError);
            return NextResponse.json(
                { error: "Usuário não encontrado" },
                { status: 404 }
            );
        }

        // Verificar se o pai existe, se for uma resposta
        if (parentId) {
            const { data: parentExists, error: parentError } = await supabase
                .from("comments")
                .select("id")
                .eq("id", parentId)
                .single();

            if (parentError || !parentExists) {
                console.error("Erro ao verificar comentário pai:", parentError);
                return NextResponse.json(
                    { error: "Comentário pai não encontrado" },
                    { status: 404 }
                );
            }
        }

        // Verificar se a história, série ou capítulo existe
        if (storyId) {
            const { data: storyExists, error: storyError } = await supabase
                .from("stories")
                .select("id")
                .eq("id", storyId)
                .single();

            if (storyError || !storyExists) {
                console.error("Erro ao verificar história:", storyError);
                return NextResponse.json(
                    { error: "História não encontrada" },
                    { status: 404 }
                );
            }
        } else if (seriesId) {
            const { data: seriesExists, error: seriesError } = await supabase
                .from("series")
                .select("id")
                .eq("id", seriesId)
                .single();

            if (seriesError || !seriesExists) {
                console.error("Erro ao verificar série:", seriesError);
                return NextResponse.json(
                    { error: "Série não encontrada" },
                    { status: 404 }
                );
            }
        } else if (chapterId) {
            const { data: chapterExists, error: chapterError } = await supabase
                .from("chapters")
                .select("id")
                .eq("id", chapterId)
                .single();

            if (chapterError || !chapterExists) {
                console.error("Erro ao verificar capítulo:", chapterError);
                return NextResponse.json(
                    { error: "Capítulo não encontrado" },
                    { status: 404 }
                );
            }
        }

        // Inserir comentário
        const commentData = {
            text: sanitizedText,
            author_id: authorId,
            parent_id: parentId || null,
            created_at: new Date().toISOString(),
        };

        // Adicionar o ID apropriado
        if (storyId) {
            commentData.story_id = storyId;
        } else if (seriesId) {
            commentData.series_id = seriesId;
        } else if (chapterId) {
            commentData.chapter_id = chapterId;
        }

        const { data: newComment, error: insertError } = await supabase
            .from("comments")
            .insert(commentData)
            .select()
            .single();

        if (insertError) {
            console.error("Erro ao inserir comentário:", insertError);
            return NextResponse.json(
                { 
                    error: "Erro ao criar comentário", 
                    details: insertError 
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Comentário adicionado com sucesso",
            comment: newComment
        }, { status: 201 });

    } catch (error) {
        console.error("Erro interno:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
