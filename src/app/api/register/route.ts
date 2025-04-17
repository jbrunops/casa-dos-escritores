import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password, username } = await request.json();
        if (!email || !password || !username) {
            return NextResponse.json(
                { error: "Todos os campos são obrigatórios" },
                { status: 400 }
            );
        }
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Verifica se o username já existe
        const { data: existingUsers, error: usernameError } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", username);
        if (usernameError) {
            return NextResponse.json(
                { error: "Erro ao verificar disponibilidade do nome de usuário" },
                { status: 500 }
            );
        }
        if (existingUsers && existingUsers.length > 0) {
            return NextResponse.json(
                { error: "Este nome de usuário já está em uso" },
                { status: 409 }
            );
        }
        // Cria o usuário
        const { data, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: { username },
        });
        if (signUpError) {
            return NextResponse.json(
                { error: signUpError.message || "Erro ao registrar usuário." },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
