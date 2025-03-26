// src/app/(auth)/login/page.js
"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Verificar se o perfil existe e criar se necessário
            try {
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .single();

                // Se o perfil não existir, criar um novo
                if (profileError && profileError.code === "PGRST116") {
                    // Extrair username dos metadados do usuário ou do email
                    const username =
                        data.user.user_metadata?.username ||
                        email.split("@")[0] ||
                        `user_${Math.random().toString(36).substring(2, 7)}`;

                    // Criar perfil
                    await supabase.from("profiles").insert({
                        id: data.user.id,
                        username,
                        email: data.user.email,
                        role: "user",
                        created_at: new Date().toISOString(),
                    });

                    console.log("Perfil criado automaticamente após login");
                }
            } catch (profileError) {
                console.error("Erro ao verificar/criar perfil:", profileError);
                // Continuar mesmo se houver erro - middleware tentará criar também
            }

            setSuccess(true);

            // Redirecionar após breve pausa para mostrar a mensagem de sucesso
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1000);
        } catch (err) {
            const errorMessages = {
                "Invalid login credentials": "E-mail ou senha incorretos.",
                "Email not confirmed":
                    "E-mail não confirmado. Verifique sua caixa de entrada.",
            };

            setError(
                errorMessages[err.message] ||
                    "Ocorreu um erro ao fazer login. Por favor, tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h1>Entrar</h1>

                {error && <div className="error-message">{error}</div>}
                {success && (
                    <div className="success-message">
                        Login realizado com sucesso! Redirecionando...
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-button"
                    >
                        {loading ? (
                            <>
                                <span className="loader"></span>
                                <span>Entrando...</span>
                            </>
                        ) : (
                            "Entrar"
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
