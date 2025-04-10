"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Lock, Loader, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tokenError, setTokenError] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createBrowserClient();

    useEffect(() => {
        // Verificar se temos o token de redefinição na URL
        const hasToken = 
            searchParams?.has('token') || 
            searchParams?.has('type') && searchParams?.get('type') === 'recovery';
        
        if (!hasToken) {
            setTokenError(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validação básica
            if (!password) {
                setError("O campo de senha é obrigatório");
                setLoading(false);
                return;
            }

            if (password.length < 6) {
                setError("A senha deve ter pelo menos 6 caracteres");
                setLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError("As senhas não coincidem");
                setLoading(false);
                return;
            }

            // Atualizar a senha
            const { error: resetError } = await supabase.auth.updateUser({
                password
            });

            if (resetError) {
                throw resetError;
            }

            // Se chegou até aqui, deu tudo certo
            setSuccess(true);
            
            // Redirecionar para login após breve pausa
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            console.error("Erro ao redefinir senha:", err);
            setError(
                err.message || 
                "Erro ao redefinir a senha. Por favor, tente novamente ou solicite um novo link."
            );
        } finally {
            setLoading(false);
        }
    };

    if (tokenError) {
        return (
            <div className="flex justify-center bg-white py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-[#E5E7EB]">
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold text-black">Link Inválido</h1>
                        <p className="mt-2 text-gray-600">
                            Este link de redefinição de senha é inválido ou expirou.
                        </p>
                    </div>
                    
                    <div className="flex items-center p-4 text-red-700 bg-red-50 rounded-lg">
                        <AlertCircle size={18} className="mr-2" />
                        Para redefinir sua senha, solicite um novo link na página de recuperação.
                    </div>
                    
                    <div className="mt-6">
                        <Link href="/forgot-password" className="flex items-center justify-center h-10 px-4 w-full text-white bg-[#484DB5] hover:bg-[#484DB5]/90 transition-all duration-200 rounded-md">
                            Solicitar novo link
                        </Link>
                        
                        <Link href="/login" className="flex items-center justify-center mt-4 text-sm text-[#484DB5] hover:text-[#484DB5]/80 transition-all duration-200">
                            <ArrowLeft size={16} className="mr-1" />
                            Voltar para o login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center bg-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-[#E5E7EB]">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-black">Redefinir Senha</h1>
                    <p className="mt-2 text-gray-600">
                        Crie uma nova senha para sua conta
                    </p>
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
                        Senha redefinida com sucesso! Redirecionando para o login...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nova Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || success}
                                required
                                minLength="6"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="Mínimo de 6 caracteres"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmar Nova Senha
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading || success}
                                required
                                minLength="6"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="Confirme sua senha"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full h-10 flex justify-center items-center px-4 border border-transparent rounded-md shadow-sm text-white bg-[#484DB5] hover:bg-[#484DB5]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="animate-spin mr-2" />
                                <span>Redefinindo...</span>
                            </>
                        ) : (
                            <>
                                <Lock size={18} className="mr-2" />
                                <span>Redefinir Senha</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6">
                    <Link href="/login" className="flex items-center justify-center text-sm text-[#484DB5] hover:text-[#484DB5]/80 transition-all duration-200">
                        <ArrowLeft size={16} className="mr-1" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    );
} 