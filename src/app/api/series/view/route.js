import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// API para incrementar visualizações de séries
export async function POST(request) {
    try {
        // Extrair ID da série da URL
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            console.error("ID da série não fornecido na requisição");
            return NextResponse.json(
                { error: "ID da série não fornecido" },
                { status: 400 }
            );
        }
        
        console.log(`API: Incrementando visualizações para série ${id}`);

        // Verificar se as credenciais estão disponíveis
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Variáveis de ambiente do Supabase não estão configuradas");
            return NextResponse.json(
                { error: "Configuração do servidor incompleta" },
                { status: 500 }
            );
        }

        // Inicializar o cliente Supabase com tratamento de erros
        let supabase;
        try {
            supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
        } catch (initError) {
            console.error("Erro ao inicializar cliente Supabase:", initError);
            return NextResponse.json(
                { error: "Erro ao conectar ao banco de dados" },
                { status: 500 }
            );
        }

        // Primeiro, obtenha o valor atual de view_count
        const { data: series, error: getError } = await supabase
            .from("series")
            .select("view_count")
            .eq("id", id)
            .single();

        if (getError) {
            console.error("Erro ao buscar série para atualizar visualizações:", getError);
            // Responder com status 200 mesmo se houver erro para não interromper o carregamento da página
            return NextResponse.json(
                { error: "Série não encontrada", success: false },
                { status: 200 }
            );
        }

        // Incrementar visualizações
        const { error: updateError } = await supabase
            .from("series")
            .update({ view_count: (series.view_count || 0) + 1 })
            .eq("id", id);

        if (updateError) {
            console.error("Erro ao atualizar visualizações:", updateError);
            // Responder com status 200 mesmo se houver erro para não interromper o carregamento da página
            return NextResponse.json(
                { error: "Erro ao atualizar visualizações", success: false },
                { status: 200 }
            );
        }
        
        console.log(`API: Visualizações atualizadas para série ${id}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro na API de visualização de séries:", error);
        // Responder com status 200 mesmo com erro para não interromper o carregamento da página
        return NextResponse.json(
            { error: "Erro interno do servidor", success: false },
            { status: 200 }
        );
    }
} 