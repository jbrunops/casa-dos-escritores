// src/app/api/admin/delete-user/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "ID de usuário não informado" },
                { status: 400 }
            );
        }

        // Cliente Supabase com Service Role para operações administrativas
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Excluir o usuário da autenticação
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Erro ao excluir usuário da autenticação:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Usuário excluído com sucesso",
        });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
