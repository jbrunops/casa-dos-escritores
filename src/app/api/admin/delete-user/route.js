// src/app/api/admin/delete-user/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logAdminAction, logPrivilegeEscalation } from "@/lib/security-logger";

export async function POST(request) {
    try {
        // Verificar autenticação primeiro
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: "Não autorizado - faça login" },
                { status: 401 }
            );
        }

        // Verificar se o usuário é administrador
        const { data: profile, error: profileError } = await supabaseAuth
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (profileError || !profile || profile.role !== "admin") {
            // Log tentativa de escalação de privilégios
            logPrivilegeEscalation(
                session.user.id,
                'delete_user',
                profile?.role || 'unknown',
                request
            );
            
            return NextResponse.json(
                { error: "Acesso negado - privilégios de administrador necessários" },
                { status: 403 }
            );
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "ID de usuário não informado" },
                { status: 400 }
            );
        }

        // Validar formato do userId (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return NextResponse.json(
                { error: "Formato de ID de usuário inválido" },
                { status: 400 }
            );
        }

        // Impedir que admin exclua a própria conta
        if (userId === session.user.id) {
            return NextResponse.json(
                { error: "Não é possível excluir sua própria conta" },
                { status: 400 }
            );
        }

        // Cliente Supabase com Service Role para operações administrativas
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Log de auditoria antes da exclusão
        logAdminAction(session.user.id, 'delete_user_attempt', userId, request);

        // Excluir o usuário da autenticação
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Erro ao excluir usuário da autenticação:", error);
            logAdminAction(session.user.id, 'delete_user_failed', userId, request);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log de auditoria após exclusão bem-sucedida
        logAdminAction(session.user.id, 'delete_user_success', userId, request);

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
