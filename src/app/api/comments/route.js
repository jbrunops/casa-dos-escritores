import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { rateLimitMiddleware, addRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = rateLimitMiddleware(request, 'comments');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
        // Criar cliente supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Obter dados da requisição
        const { text, authorId, storyId, seriesId, chapterId, parentId } = await request.json();

        // Importar sanitização
        const { validateAndSanitizeForm } = await import("@/lib/sanitize");

        // Definir regras de validação
        const validationRules = {
            text: {
                type: 'comment',
                required: true,
                minLength: 1,
                maxLength: 2000
            }
        };

        // Validar e sanitizar dados
        const validation = validateAndSanitizeForm({ text }, validationRules);
        
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.errors.join(', ') },
                { status: 400 }
            );
        }

        const sanitizedText = validation.sanitizedData.text;

        if (!authorId) {
            return NextResponse.json(
                { error: "O ID do autor é obrigatório" },
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

        // Inicializar variáveis para o autor do conteúdo e título
        let contentAuthorId = null;
        let contentTitle = "";
        let contentType = "story";

        // Verificar se a história, série ou capítulo existe
        if (storyId) {
            const { data: storyExists, error: storyError } = await supabase
                .from("stories")
                .select("id, title, author_id")
                .eq("id", storyId)
                .single();

            if (storyError || !storyExists) {
                console.error("Erro ao verificar história:", storyError);
                return NextResponse.json(
                    { error: "História não encontrada" },
                    { status: 404 }
                );
            }
            
            contentAuthorId = storyExists.author_id;
            contentTitle = storyExists.title;
            contentType = "story";
            
        } else if (seriesId) {
            const { data: seriesExists, error: seriesError } = await supabase
                .from("series")
                .select("id, title, author_id")
                .eq("id", seriesId)
                .single();

            if (seriesError || !seriesExists) {
                console.error("Erro ao verificar série:", seriesError);
                return NextResponse.json(
                    { error: "Série não encontrada" },
                    { status: 404 }
                );
            }
            
            contentAuthorId = seriesExists.author_id;
            contentTitle = seriesExists.title;
            contentType = "series";
            
        } else if (chapterId) {
            const { data: chapterExists, error: chapterError } = await supabase
                .from("chapters")
                .select("id, title, author_id, series_id")
                .eq("id", chapterId)
                .single();

            if (chapterError || !chapterExists) {
                console.error("Erro ao verificar capítulo:", chapterError);
                return NextResponse.json(
                    { error: "Capítulo não encontrado" },
                    { status: 404 }
                );
            }
            
            contentAuthorId = chapterExists.author_id;
            contentTitle = chapterExists.title;
            contentType = "chapter";
            
            // Se o capítulo pertence a uma série, buscar o título da série também
            if (chapterExists.series_id) {
                const { data: seriesData } = await supabase
                    .from("series")
                    .select("title")
                    .eq("id", chapterExists.series_id)
                    .single();
                    
                if (seriesData) {
                    contentTitle = `${seriesData.title} - ${contentTitle}`;
                }
            }
        }

        // Inserir comentário com texto sanitizado
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

        // Buscar informações do autor do comentário
        const { data: commentAuthor } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", authorId)
            .single();
            
        const authorUsername = commentAuthor?.username || "Alguém";
        
        // Enviar notificação ao autor do conteúdo (se não for o mesmo que comentou)
        if (contentAuthorId && contentAuthorId !== authorId) {
            // Determinar o tipo de notificação com base no tipo de conteúdo
            const notificationType = parentId ? "reply" : "comment";
            
            // Criar texto da notificação
            let notificationContent = `${authorUsername} comentou em`;
            
            if (contentType === "story") {
                notificationContent = `${authorUsername} comentou em sua história "${contentTitle}"`;
            } else if (contentType === "series") {
                notificationContent = `${authorUsername} comentou em sua série "${contentTitle}"`;
            } else if (contentType === "chapter") {
                notificationContent = `${authorUsername} comentou em seu capítulo "${contentTitle}"`;
            }
            
            // Dados adicionais para a notificação
            const additionalData = {};
            
            if (storyId) {
                additionalData.story_id = storyId;
                additionalData.story_title = contentTitle;
            } else if (seriesId) {
                additionalData.series_id = seriesId;
                additionalData.series_title = contentTitle;
            } else if (chapterId) {
                additionalData.chapter_id = chapterId;
                additionalData.chapter_title = contentTitle;
            }
            
            // Inserir notificação para o autor do conteúdo
            await supabase.from("notifications").insert({
                user_id: contentAuthorId,
                type: notificationType,
                content: notificationContent,
                related_id: newComment.id,
                is_read: false,
                created_at: new Date().toISOString(),
                additional_data: additionalData
            });
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
