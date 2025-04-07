import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Log para depuração
        console.log("Iniciando processamento do comentário");

        // Usar valores fixos para desenvolvimento local ou variáveis de ambiente para produção
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkykesdoqdeagnuvlxao.supabase.co";
        // Usar a chave de serviço fornecida como fallback quando a variável de ambiente não estiver definida
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4Nzk1NiwiZXhwIjoyMDU5MzYzOTU2fQ.mpMIymtj-VHrouVu9RGEcQY3qvNOAi6hgjUW-Cs2in0";

        console.log("Conectando ao Supabase com chave de serviço");
        
        // Criar cliente supabase com a chave de serviço para ignorar as políticas RLS
        let supabase;
        try {
            supabase = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            
            // Verificar se o cliente foi criado corretamente
            if (!supabase) {
                throw new Error("Falha ao criar cliente Supabase");
            }
        } catch (error) {
            console.error("Erro ao criar cliente Supabase:", error);
            return NextResponse.json(
                { error: "Erro ao inicializar o servidor: " + error.message },
                { status: 500 }
            );
        }

        // Obter dados da requisição com tratamento de erro de parsing
        let reqData;
        try {
            reqData = await request.json();
            console.log("Dados recebidos:", JSON.stringify(reqData));
        } catch (error) {
            console.error("Erro ao fazer parse do JSON da requisição:", error);
            return NextResponse.json(
                { error: "Formato de dados inválido" },
                { status: 400 }
            );
        }

        const { text, authorId, storyId, seriesId, chapterId, parentId } = reqData;

        // Verificar campos obrigatórios
        if (!text || !text.trim()) {
            return NextResponse.json(
                { error: "O texto do comentário é obrigatório" },
                { status: 400 }
            );
        }

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
        console.log("Verificando usuário com ID:", authorId);
        const { data: userExists, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", authorId)
            .single();

        if (userError) {
            console.error("Erro ao verificar usuário:", userError);
            return NextResponse.json(
                { error: "Usuário não encontrado", details: userError.message },
                { status: 404 }
            );
        }

        if (!userExists) {
            console.error("Usuário não encontrado com ID:", authorId);
            return NextResponse.json(
                { error: "Usuário não encontrado" },
                { status: 404 }
            );
        }

        // Verificar se o pai existe, se for uma resposta
        if (parentId) {
            console.log("Verificando comentário pai com ID:", parentId);
            const { data: parentExists, error: parentError } = await supabase
                .from("comments")
                .select("id")
                .eq("id", parentId)
                .single();

            if (parentError) {
                console.error("Erro ao verificar comentário pai:", parentError);
                return NextResponse.json(
                    { error: "Comentário pai não encontrado", details: parentError.message },
                    { status: 404 }
                );
            }

            if (!parentExists) {
                console.error("Comentário pai não encontrado com ID:", parentId);
                return NextResponse.json(
                    { error: "Comentário pai não encontrado" },
                    { status: 404 }
                );
            }
        }

        // Verificar se a história, série ou capítulo existe
        let contentType, contentId;
        
        if (storyId) {
            contentType = "história";
            contentId = storyId;
            console.log("Verificando história com ID:", storyId);
            
            const { data: storyExists, error: storyError } = await supabase
                .from("stories")
                .select("id")
                .eq("id", storyId)
                .single();

            if (storyError) {
                console.error("Erro ao verificar história:", storyError);
                return NextResponse.json(
                    { error: "História não encontrada", details: storyError.message },
                    { status: 404 }
                );
            }

            if (!storyExists) {
                console.error("História não encontrada com ID:", storyId);
                return NextResponse.json(
                    { error: "História não encontrada" },
                    { status: 404 }
                );
            }
        } else if (seriesId) {
            contentType = "série";
            contentId = seriesId;
            console.log("Verificando série com ID:", seriesId);
            
            const { data: seriesExists, error: seriesError } = await supabase
                .from("series")
                .select("id")
                .eq("id", seriesId)
                .single();

            if (seriesError) {
                console.error("Erro ao verificar série:", seriesError);
                return NextResponse.json(
                    { error: "Série não encontrada", details: seriesError.message },
                    { status: 404 }
                );
            }

            if (!seriesExists) {
                console.error("Série não encontrada com ID:", seriesId);
                return NextResponse.json(
                    { error: "Série não encontrada" },
                    { status: 404 }
                );
            }
        } else if (chapterId) {
            contentType = "capítulo";
            contentId = chapterId;
            console.log("Verificando capítulo com ID:", chapterId);
            
            const { data: chapterExists, error: chapterError } = await supabase
                .from("chapters")
                .select("id")
                .eq("id", chapterId)
                .single();

            if (chapterError) {
                console.error("Erro ao verificar capítulo:", chapterError);
                return NextResponse.json(
                    { error: "Capítulo não encontrado", details: chapterError.message },
                    { status: 404 }
                );
            }

            if (!chapterExists) {
                console.error("Capítulo não encontrado com ID:", chapterId);
                return NextResponse.json(
                    { error: "Capítulo não encontrado" },
                    { status: 404 }
                );
            }
        }

        // Inserir comentário
        const commentData = {
            text,
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

        console.log("Inserindo comentário com dados:", JSON.stringify(commentData));
        
        try {
            // Importante: usamos o cliente com a chave de serviço que ignora as políticas RLS
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
                        details: insertError.message || JSON.stringify(insertError) 
                    },
                    { status: 500 }
                );
            }
    
            if (!newComment) {
                console.error("Comentário não foi criado, mas sem erro reportado");
                return NextResponse.json(
                    { error: "Erro ao criar comentário: nenhum dado retornado" },
                    { status: 500 }
                );
            }
            
            console.log("Comentário criado com sucesso, ID:", newComment.id);
            
            return NextResponse.json({
                message: "Comentário adicionado com sucesso",
                comment: newComment
            }, { status: 201 });
        } catch (insertError) {
            console.error("Exceção ao inserir comentário:", insertError);
            return NextResponse.json(
                { 
                    error: "Erro ao criar comentário", 
                    details: insertError.message || "Erro desconhecido" 
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Erro interno não tratado:", error);
        return NextResponse.json(
            { 
                error: "Erro interno do servidor",
                details: error.message || "Erro desconhecido" 
            },
            { status: 500 }
        );
    }
}
