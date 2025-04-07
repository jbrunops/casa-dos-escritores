// src/app/(auth)/login/page.js
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Loader, AlertCircle, CheckCircle, BookOpen } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLocalhost, setIsLocalhost] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();
    
    // Verificar se estamos no localhost
    useEffect(() => {
        setIsLocalhost(window.location.hostname === 'localhost');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            console.log("Tentando login para:", email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            
            console.log("Login bem-sucedido, sessão criada");
            setSuccess(true);

            // Verificar se o perfil existe e criar se necessário
            try {
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .single();

                // Se o perfil não existir, criar um novo
                if (profileError && profileError.code === "PGRST116") {
                    console.log("Perfil não encontrado, criando novo perfil");
                    
                    // Extrair username dos metadados do usuário ou do email
                    const username =
                        data.user.user_metadata?.username ||
                        email.split("@")[0] ||
                        `user_${Math.random().toString(36).substring(2, 7)}`;

                    // Criar perfil
                    const { error: insertError } = await supabase.from("profiles").insert({
                        id: data.user.id,
                        username,
                        email: data.user.email,
                        role: "user",
                        created_at: new Date().toISOString(),
                    });

                    if (insertError) {
                        console.error("Erro ao criar perfil:", insertError);
                    } else {
                        console.log("Perfil criado com sucesso");
                    }
                } else {
                    console.log("Perfil encontrado:", profile?.id);
                }
            } catch (profileError) {
                console.error("Erro ao verificar/criar perfil:", profileError);
            }

            // Em desenvolvimento local, adicionar um pequeno atraso para dar tempo aos cookies serem salvos
            if (isLocalhost) {
                setTimeout(() => {
                    router.push("/dashboard");
                    router.refresh();
                }, 1500);
            } else {
                // Redirecionar após breve pausa para mostrar a mensagem de sucesso
                setTimeout(() => {
                    router.push("/dashboard");
                    router.refresh();
                }, 1000);
            }
        } catch (err) {
            console.error("Erro de login:", err.message);
            
            const errorMessages = {
                "Invalid login credentials": "E-mail ou senha incorretos.",
                "Email not confirmed": "E-mail não confirmado. Verifique sua caixa de entrada.",
            };

            setError(
                errorMessages[err.message] ||
                    `Ocorreu um erro ao fazer login: ${err.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Entrar</h1>
                    <p className="auth-subheading">Acesse sua conta para continuar</p>
                </div>

                {error && (
                    <div className="alert error-message">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="alert success-message">
                        <CheckCircle size={18} />
                        Login realizado com sucesso! Redirecionando...
                    </div>
                )}
                
                {isLocalhost && (
                    <div className="alert info-message mb-4">
                        <span>Ambiente de desenvolvimento local detectado.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email" className="input-label">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                            className="form-input"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="input-label">
                                Senha
                            </label>
                            <Link href="/forgot-password" className="text-sm text-[#484DB5] hover:text-[#7A80FB] font-medium">
                                Esqueceu?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="form-input"
                            placeholder="Sua senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-full"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="spinner" />
                                <span>Entrando...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Entrar</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-redirect">
                    Ainda não tem uma conta?{" "}
                    <Link href="/signup">Cadastre-se</Link>
                </p>
            </div>
        </div>
    );
}
