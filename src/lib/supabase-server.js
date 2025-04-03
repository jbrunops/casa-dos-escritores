import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
}
