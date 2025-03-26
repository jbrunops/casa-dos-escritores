// src/app/api/register/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { email, password, username } = await request.json();

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: "Todos os campos são obrigatórios" },
                { status: 400 }
            );
        }

        // Criar cliente Supabase usando a chave de serviço
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Verificar se o nome de usuário já existe
        const { data: existingUsers, error: usernameError } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", username);

        if (usernameError) {
            console.error("Erro ao verificar nome de usuário:", usernameError);
            return NextResponse.json(
                { error: "Erro ao verificar nome de usuário" },
                { status: 500 }
            );
        }

        if (existingUsers && existingUsers.length > 0) {
            return NextResponse.json(
                { error: "Este nome de usuário já está em uso" },
                { status: 400 }
            );
        }

        // Criar usuário usando API do Supabase
        const { data, error: authError } = await supabase.auth.admin.createUser(
            {
                email,
                password,
                email_confirm: true, // Confirma o email automaticamente
                user_metadata: { username },
            }
        );

        if (authError) {
            console.error("Erro ao criar usuário:", authError);
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (!data.user) {
            return NextResponse.json(
                { error: "Falha ao criar usuário" },
                { status: 500 }
            );
        }

        // Inserir perfil diretamente (com o usuário já confirmado)
        try {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    username,
                    email,
                    role: "user",
                    created_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error("Erro ao criar perfil:", profileError);

                // Mesmo com erro no perfil, retornar sucesso parcial
                return NextResponse.json({
                    success: true,
                    warning: "Seu perfil será criado no primeiro login",
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                    },
                });
            }

            return NextResponse.json({
                success: true,
                message: "Conta criada com sucesso!",
                user: {
                    id: data.user.id,
                    email: data.user.email,
                },
            });
        } catch (profileErr) {
            console.error("Exceção ao criar perfil:", profileErr);

            // Mesmo com erro no perfil, retornar sucesso parcial
            return NextResponse.json({
                success: true,
                warning: "Seu perfil será criado no primeiro login",
                user: {
                    id: data.user.id,
                    email: data.user.email,
                },
            });
        }
    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
