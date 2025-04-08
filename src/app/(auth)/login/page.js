// src/app/(auth)/login/page.js
"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Loader, AlertCircle, CheckCircle } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-[#E5E7EB]">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-black">Entrar</h1>
                    <p className="mt-2 text-gray-600">Acesse sua conta para continuar</p>
                </div>

                {error && (
                    <div className="flex items-center p-4 text-red-700 bg-red-50 rounded-lg">
                        <AlertCircle size={18} className="mr-2" />
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="flex items-center p-4 text-green-700 bg-green-50 rounded-lg">
                        <CheckCircle size={18} className="mr-2" />
                        Login realizado com sucesso! Redirecionando...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
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
                                disabled={loading}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="Sua senha"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link href="/forgot-password" className="text-[#484DB5] hover:underline">
                                Esqueceu?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#484DB5] hover:bg-[#484DB5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="animate-spin mr-2" />
                                <span>Entrando...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} className="mr-2" />
                                <span>Entrar</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Ainda não tem uma conta?{" "}
                    <Link href="/signup" className="text-[#484DB5] hover:underline font-medium">
                        Cadastre-se
                    </Link>
                </p>
            </div>
        </div>
    );
}
