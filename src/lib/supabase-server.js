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
                        // Tratar erro de forma silenciosa
                        console.error(`Erro ao obter cookie ${name}:`, error);
                        return null;
                    }
                },
                set(name, value, options = {}) {
                    try {
                        // No servidor, use o método correto
                        cookieStore.set({
                            name,
                            value,
                            ...options,
                        });
                    } catch (error) {
                        console.error(`Erro ao definir cookie ${name}:`, error);
                    }
                },
                remove(name, options = {}) {
                    try {
                        cookieStore.set({
                            name,
                            value: "",
                            ...options,
                        });
                    } catch (error) {
                        console.error(`Erro ao remover cookie ${name}:`, error);
                    }
                },
            },
        }
    );
}
