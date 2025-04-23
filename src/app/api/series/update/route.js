import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Não autorizado" },
                { status: 401 }
            );
        }
        
        // Obter dados do corpo da requisição
        const requestData = await request.json();
        const { 
            id, 
            title, 
            description, 
            genre, 
            tags, 
            cover_url,
            coverFile
        } = requestData;
        
        if (!id || !title) {
            return NextResponse.json(
                { success: false, message: "Dados inválidos" },
                { status: 400 }
            );
        }
        
        // Verificar se o usuário é o autor da série
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("author_id")
            .eq("id", id)
            .single();
            
        if (seriesError) {
            return NextResponse.json(
                { success: false, message: "Série não encontrada" },
                { status: 404 }
            );
        }
        
        if (series.author_id !== user.id) {
            return NextResponse.json(
                { success: false, message: "Você não tem permissão para editar esta série" },
                { status: 403 }
            );
        }
        
        // Preparar dados para atualização
        const updateData = {
            title,
            description,
            genre,
            tags,
            updated_at: new Date().toISOString(),
        };
        
        // Se tiver URL de capa, incluir
        if (cover_url !== null) {
            updateData.cover_url = cover_url;
        }
        
        // Processar upload de arquivo se fornecido
        if (coverFile) {
            // Precisamos processar o upload do arquivo de uma forma diferente
            // Como files não podem ser enviados diretamente via JSON,
            // provavelmente você usaria um FormData em uma rota de upload separada
            // e depois enviaria a URL resultante para esta rota.
            // Aqui assumimos que isso já foi feito ou será feito separadamente.
        }
        
        // Atualizar a série
        const { data, error } = await supabase
            .from("series")
            .update(updateData)
            .eq("id", id)
            .select();
            
        if (error) {
            console.error("Erro ao atualizar série:", error);
            return NextResponse.json(
                { success: false, message: "Falha ao atualizar série" },
                { status: 500 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: "Série atualizada com sucesso",
            data
        });
        
    } catch (error) {
        console.error("Erro ao processar requisição:", error);
        return NextResponse.json(
            { success: false, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
} 