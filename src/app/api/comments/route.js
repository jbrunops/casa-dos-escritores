import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { text, storyId, authorId, parentId } = await request.json();

        console.log("API recebeu:", { text, storyId, authorId, parentId });

        // Validação básica
        if (!text || !storyId || !authorId) {
            console.log("Campos obrigatórios ausentes");
            return NextResponse.json(
                { error: "Campos obrigatórios ausentes" },
                { status: 400 }
            );
        }

        // Criar cliente Supabase usando a chave de serviço
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        console.log("URL do Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log(
            "Chave de serviço definida:",
            !!process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Criar objeto de comentário
        const commentData = {
            text,
            story_id: storyId,
            author_id: authorId,
            created_at: new Date().toISOString(),
        };

        // Adicionar parent_id apenas se for fornecido
        if (parentId) {
            commentData.parent_id = parentId;
        }

        console.log("Tentando inserir:", commentData);

        // Inserir comentário
        const { data, error } = await supabase
            .from("comments")
            .insert(commentData)
            .select();

        if (error) {
            console.error("Erro detalhado do Supabase:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
            });

            return NextResponse.json(
                {
                    error: `Falha ao adicionar comentário: ${error.message}`,
                    details: {
                        code: error.code,
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                    },
                },
                { status: 500 }
            );
        }

        console.log("Comentário inserido com sucesso:", data);

        return NextResponse.json({
            success: true,
            comment: data[0],
        });
    } catch (error) {
        console.error("Erro completo do servidor:", error);

        return NextResponse.json(
            {
                error: "Erro interno do servidor",
                details: error.toString(),
                stack: error.stack,
            },
            { status: 500 }
        );
    }
}
