// src/app/(auth)/signup/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { UserPlus, Mail, Lock, User, Loader, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-[#E5E7EB]">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-black">Criar Conta</h1>
                    <p className="mt-2 text-gray-600">Junte-se à nossa comunidade de escritores</p>
                </div>

                {error && (
                    <div className="flex items-center p-4 text-red-700 bg-red-50 rounded-lg">
                        <AlertCircle size={18} className="mr-2" />
                        {error}
                    </div>
                )}
                
                {warning && (
                    <div className="flex items-center p-4 text-yellow-700 bg-yellow-50 rounded-lg">
                        <AlertTriangle size={18} className="mr-2" />
                        {warning}
                    </div>
                )}
                
                {success && (
                    <div className="flex items-center p-4 text-green-700 bg-green-50 rounded-lg">
                        <CheckCircle size={18} className="mr-2" />
                        Conta criada com sucesso!{" "}
                        {warning ? warning : "Redirecionando..."}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
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
                                className="mt-1 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || success}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength="6"
                                disabled={loading || success}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="Mínimo de 6 caracteres"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                A senha deve ter pelo menos 6 caracteres
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#484DB5] hover:bg-[#484DB5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="animate-spin mr-2" />
                                <span>Criando conta...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} className="mr-2" />
                                <span>Criar conta</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-[#484DB5] hover:underline font-medium">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    );
}
