import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const notificationData = await request.json();

        // Validação básica
        if (
            !notificationData.user_id ||
            !notificationData.type ||
            !notificationData.content
        ) {
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

        // Adicionar timestamp
        const data = {
            ...notificationData,
            created_at: new Date().toISOString(),
        };

        // Inserir notificação
        const { data: notification, error } = await supabase
            .from("notifications")
            .insert(data)
            .select();

        if (error) {
            console.error("Erro ao criar notificação:", error);
            return NextResponse.json(
                { error: "Falha ao criar notificação" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            notification: notification[0],
        });
    } catch (error) {
        console.error("Erro do servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
