"use client";

import { useState, FormEvent } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Loader, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
            try {
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .single();
                if (profileError && profileError.code === "PGRST116") {
                    const username =
                        data.user.user_metadata?.username ||
                        email.split("@")[0] ||
                        `user_${Math.random().toString(36).substring(2, 7)}`;
                    await supabase.from("profiles").insert({
                        id: data.user.id,
                        username,
                        email: data.user.email,
                        role: "user",
                        created_at: new Date().toISOString(),
                    });
                    console.log("Perfil criado automaticamente após login");
                }
            } catch (profileError: any) {
                console.error("Erro ao verificar/criar perfil:", profileError);
            }
            setSuccess(true);
            setTimeout(() => router.push("/"), 1000);
        } catch (err: any) {
            setError(err.message || "Falha ao fazer login. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center bg-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-[#E5E7EB]">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-black">Entrar</h1>
                </div>
                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                        <CheckCircle size={18} />
                        <span>Login realizado com sucesso!</span>
                    </div>
                )}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            E-mail
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#484DB5] focus:border-[#484DB5] sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <Mail className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#484DB5] focus:border-[#484DB5] sm:text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <Lock className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#484DB5] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5] transition-all duration-300"
                        >
                            {loading ? (
                                <Loader className="animate-spin mr-2" size={18} />
                            ) : (
                                <LogIn className="mr-2" size={18} />
                            )}
                            Entrar
                        </button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <Link href="/forgot-password" className="inline-flex items-center text-[#484DB5] hover:underline">
                        Esqueceu a senha?
                    </Link>
                </div>
                <div className="mt-2 text-center">
                    <span className="text-gray-500">Não tem uma conta?</span>{' '}
                    <Link href="/signup" className="inline-flex items-center text-[#484DB5] hover:underline">
                        Cadastre-se
                    </Link>
                </div>
            </div>
        </div>
    );
}
