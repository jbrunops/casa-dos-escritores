// src/app/(auth)/signup/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { UserPlus, Mail, Lock, User, Loader, AlertCircle, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setWarning(null);
        setSuccess(false);

        try {
            // Validação básica
            if (!username || !email || !password) {
                setError("Todos os campos são obrigatórios");
                setLoading(false);
                return;
            }

            if (password.length < 6) {
                setError("A senha deve ter pelo menos 6 caracteres");
                setLoading(false);
                return;
            }

            // Verificar se o username já existe
            const { data: existingUsers, error: usernameError } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username);

            if (usernameError) {
                console.error(
                    "Erro ao verificar nome de usuário:",
                    usernameError
                );
                throw new Error(
                    "Erro ao verificar disponibilidade do nome de usuário"
                );
            }

            if (existingUsers && existingUsers.length > 0) {
                setError("Este nome de usuário já está em uso");
                setLoading(false);
                return;
            }

            // Criar usuário diretamente com Supabase
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Tentar criar perfil automaticamente
            try {
                if (data.user) {
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
                        console.warn("Aviso ao criar perfil:", profileError);
                        setWarning(
                            "Seu perfil será criado automaticamente no primeiro login"
                        );
                    }
                }
            } catch (profileErr) {
                console.warn("Exceção ao criar perfil:", profileErr);
                setWarning(
                    "Seu perfil será criado automaticamente no primeiro login"
                );
            }

            // Se chegou aqui, o usuário foi criado (mesmo que com aviso)
            setSuccess(true);

            // Se há necessidade de confirmar o email
            if (!data.session) {
                setSuccess(true);
                setWarning(
                    (prev) =>
                        prev ||
                        "Por favor, verifique seu email para confirmar sua conta"
                );

                // Redirecionar para login após breve pausa
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
                return;
            }

            // Caso contrário, já temos uma sessão, podemos redirecionar para o dashboard
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err) {
            console.error("Erro ao criar conta:", err);

            // Tratamento específico de erros comuns
            if (
                err.message.includes("já está cadastrado") ||
                err.message.includes("already registered") ||
                err.message.includes("already been registered")
            ) {
                setError("Este e-mail já está cadastrado");
            } else if (err.message.includes("nome de usuário já está em uso")) {
                setError("Este nome de usuário já está em uso");
            } else {
                setError(
                    err.message ||
                        "Erro ao criar conta. Por favor, tente novamente."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Criar Conta</h1>
                    <p className="auth-subheading">Junte-se à nossa comunidade de escritores</p>
                </div>

                {error && (
                    <div className="alert error-message">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                
                {warning && (
                    <div className="alert warning-message">
                        <AlertTriangle size={18} />
                        {warning}
                    </div>
                )}
                
                {success && (
                    <div className="alert success-message">
                        <CheckCircle size={18} />
                        Conta criada com sucesso!{" "}
                        {warning ? warning : "Redirecionando..."}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username" className="input-label">
                            Nome de usuário
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Como você quer ser chamado"
                            disabled={loading || success}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="input-label">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            disabled={loading || success}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="input-label">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo de 6 caracteres"
                            disabled={loading || success}
                            required
                            className="form-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="btn-primary btn-full"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="spinner" />
                                <span>Criando conta...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                <span>Criar conta</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-redirect">
                    Já tem uma conta?{" "}
                    <Link href="/login">Entrar</Link>
                </p>
            </div>
        </div>
    );
}
