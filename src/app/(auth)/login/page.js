// src/app/(auth)/login/page.js
"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Loader, AlertCircle, CheckCircle, User } from "lucide-react";

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("");
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

        let loginData = null;
        let loginError = null;

        try {
            // Primeira tentativa: Logar com o identifier como e-mail
            const { data: emailLoginData, error: emailLoginError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password,
            });

            if (emailLoginError) {
                // Se o erro for de credenciais inválidas, tentar como nome de usuário
                if (emailLoginError.message === "Invalid login credentials") {
                    console.log("Falha no login por e-mail, tentando como nome de usuário...");
                    const { data: profile, error: profileError } = await supabase
                        .from("profiles")
                        .select("email")
                        .eq("username", identifier)
                        .single();

                    if (profileError) {
                        // Se o nome de usuário não for encontrado ou outro erro ocorrer
                        console.error("Erro ao buscar perfil por nome de usuário:", profileError);
                        loginError = emailLoginError; // Mantém o erro original de credenciais inválidas
                    } else if (profile && profile.email) {
                        // Tentar login com o e-mail encontrado do perfil
                        const { data: usernameLoginData, error: usernameLoginError } = await supabase.auth.signInWithPassword({
                            email: profile.email,
                            password,
                        });
                        if (usernameLoginError) {
                            loginError = usernameLoginError; // Erro ao logar com e-mail do usuário
                        } else {
                            loginData = usernameLoginData; // Sucesso ao logar com e-mail do usuário
                        }
                    } else {
                        // Perfil não encontrado ou sem e-mail (improvável se o trigger estiver correto)
                        loginError = emailLoginError; // Mantém o erro original
                    }
                } else {
                    // Outro tipo de erro no login por e-mail (ex: e-mail não confirmado)
                    loginError = emailLoginError;
                }
            } else {
                loginData = emailLoginData; // Sucesso no login por e-mail
            }

            if (loginError) throw loginError;
            if (!loginData || !loginData.user) throw new Error("Falha ao obter dados do usuário após o login.");

            // A partir daqui, loginData.user contém o usuário autenticado
            // A lógica de buscar/criar perfil pode continuar como antes, usando loginData.user.id e loginData.user.email

            let userProfile = null;
            let profileUsername = null;

            try {
                const { data: fetchedProfile, error: profileFetchError } = await supabase
                    .from("profiles")
                    .select("id, username, first_name, last_name") // Buscar mais dados se necessário
                    .eq("id", loginData.user.id)
                    .single();

                if (profileFetchError && profileFetchError.code !== "PGRST116") {
                    console.error("Erro ao buscar perfil existente:", profileFetchError);
                } else {
                    userProfile = fetchedProfile;
                    profileUsername = fetchedProfile?.username;
                }

                if (!userProfile) {
                    console.log("Perfil não encontrado, tentando criar um novo (isso pode indicar um problema com o trigger handle_new_user).");
                    // Tentar pegar dados do metadata se existirem (do signup)
                    const metaUsername = loginData.user.user_metadata?.username;
                    const metaFirstName = loginData.user.user_metadata?.first_name;
                    const metaLastName = loginData.user.user_metadata?.last_name;

                    const defaultUsername =
                        metaUsername ||
                        loginData.user.email.split("@")[0] ||
                        `user_${Math.random().toString(36).substring(2, 7)}`;

                    const { data: newProfile, error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            id: loginData.user.id,
                            username: defaultUsername,
                            email: loginData.user.email,
                            first_name: metaFirstName, // Tenta usar do metadata
                            last_name: metaLastName,  // Tenta usar do metadata
                            role: "user", // Ajuste conforme necessário
                            created_at: new Date().toISOString(),
                        })
                        .select("username")
                        .single();
                        
                    if (insertError) {
                        console.error("Erro ao CRIAR perfil após login:", insertError);
                    } else {
                        profileUsername = newProfile?.username;
                        console.log("Perfil criado automaticamente após login com username:", profileUsername);
                    }
                }
            } catch (profileHandlingError) {
                console.error("Erro GERAL ao verificar/criar perfil após login:", profileHandlingError);
            }

            setSuccess(true);

            setTimeout(() => {
                if (profileUsername) {
                    router.push(`/profile/${encodeURIComponent(profileUsername)}`);
                } else {
                     // Fallback se o username ainda não estiver disponível, talvez para dashboard
                    console.warn("Não foi possível obter o username para redirecionamento, indo para /dashboard.");
                    router.push("/dashboard");
                }
                 router.refresh();
            }, 1000);
        } catch (err) {
            console.error("Erro no processo de login:", err);
            const errorMessages = {
                "Invalid login credentials": "E-mail/Usuário ou senha incorretos.",
                "Email not confirmed":
                    "E-mail não confirmado. Verifique sua caixa de entrada.",
                "User not found": "E-mail/Usuário ou senha incorretos.",
            };

            let displayError = errorMessages[err.message] || "Ocorreu um erro ao fazer login. Por favor, tente novamente.";
            if (err.message === "Invalid login credentials") {
                displayError = "E-mail/Usuário ou senha incorretos.";
            }

            setError(displayError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center bg-white py-8 px-4 sm:px-6 lg:px-8">
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
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                                E-mail ou Usuário 
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" /> 
                                </div>
                                <input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="pl-10 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                    placeholder="seu@email.com ou nome_de_usuario"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                             <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="pl-10 block w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                    placeholder="Sua senha"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link href="/forgot-password" className="text-[#484DB5] hover:underline">
                                Esqueceu sua senha?
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
