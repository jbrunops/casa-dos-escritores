"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Mail, Loader, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createBrowserClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validação básica
            if (!email) {
                setError("O campo de e-mail é obrigatório");
                setLoading(false);
                return;
            }

            // Enviar email de recuperação de senha
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                throw resetError;
            }

            // Se chegou até aqui, deu tudo certo
            setSuccess(true);
        } catch (err) {
            console.error("Erro ao solicitar recuperação de senha:", err);
            setError(
                err.message || 
                "Erro ao solicitar recuperação de senha. Por favor, tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center bg-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-[#E5E7EB]">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-black">Recuperar Senha</h1>
                    <p className="mt-2 text-gray-600">
                        Enviaremos um link para redefinir sua senha
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
                        Link de recuperação enviado! Verifique seu email para redefinir sua senha.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full h-10 flex justify-center items-center px-4 border border-transparent rounded-md shadow-sm text-white bg-[#484DB5] hover:bg-[#484DB5]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="animate-spin mr-2" />
                                <span>Enviando...</span>
                            </>
                        ) : (
                            <>
                                <Mail size={18} className="mr-2" />
                                <span>Enviar link de recuperação</span>
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