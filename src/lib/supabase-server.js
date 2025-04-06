import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
    try {
        const cookieStore = cookies();
        
        // Verificar se as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error("Variáveis de ambiente do Supabase não foram carregadas corretamente no servidor:");
            console.error("URL:", supabaseUrl ? "Definida" : "Não definida");
            console.error("KEY:", supabaseKey ? "Definida" : "Não definida");
            throw new Error("Configuração incompleta do Supabase no servidor");
        }

        return createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    get(name) {
                        try {
                            return cookieStore.get(name)?.value;
                        } catch (error) {
                            console.error(`Erro ao obter cookie ${name}:`, error);
                            return null;
                        }
                    },
                    set(name, value, options) {
                        try {
                            // Ensure we're in a server context
                            if (typeof cookieStore.set === 'function') {
                                cookieStore.set({
                                    name,
                                    value,
                                    ...options,
                                });
                            } else {
                                console.warn("Tentativa de definir cookie fora de um Server Action ou Route Handler");
                            }
                        } catch (error) {
                            console.error(`Erro ao definir cookie ${name}:`, error);
                        }
                    },
                    remove(name, options) {
                        try {
                            // Ensure we're in a server context
                            if (typeof cookieStore.set === 'function') {
                                cookieStore.set({
                                    name,
                                    value: "",
                                    ...options,
                                });
                            } else {
                                console.warn("Tentativa de remover cookie fora de um Server Action ou Route Handler");
                            }
                        } catch (error) {
                            console.error(`Erro ao remover cookie ${name}:`, error);
                        }
                    },
                },
            }
        );
    } catch (error) {
        console.error("Erro ao criar cliente Supabase no servidor:", error);
        throw error;
    }
}