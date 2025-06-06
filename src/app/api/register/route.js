// src/app/api/register/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(request) {
    try {
        // Aplicar rate limiting para autenticação
        const rateLimitResponse = rateLimitMiddleware(request, 'auth');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
        const { email, password, username } = await request.json();

        // Importar sanitização
        const { validateAndSanitizeForm } = await import("@/lib/sanitize");

        // Definir regras de validação
        const validationRules = {
            email: {
                type: 'email',
                required: true,
                maxLength: 255
            },
            username: {
                type: 'text',
                required: true,
                minLength: 3,
                maxLength: 30
            },
            password: {
                type: 'text',
                required: true,
                minLength: 6,
                maxLength: 128
            }
        };

        // Validar e sanitizar dados
        const validation = validateAndSanitizeForm({ email, username, password }, validationRules);
        
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.errors.join(', ') },
                { status: 400 }
            );
        }

        const { email: sanitizedEmail, username: sanitizedUsername, password: sanitizedPassword } = validation.sanitizedData;

        // Validações adicionais para username
        if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
            return NextResponse.json(
                { error: "Nome de usuário deve conter apenas letras, números, _ e -" },
                { status: 400 }
            );
        }

        // Criar cliente Supabase usando a chave de serviço
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verificar se o nome de usuário já existe
        const { data: existingUsers, error: usernameError } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", sanitizedUsername);

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
                email: sanitizedEmail,
                password: sanitizedPassword,
                email_confirm: true,
                user_metadata: { username: sanitizedUsername },
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

        // Inserir perfil
        try {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    username: sanitizedUsername,
                    email: sanitizedEmail,
                    role: "user",
                    created_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error("Erro ao criar perfil:", profileError);
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
