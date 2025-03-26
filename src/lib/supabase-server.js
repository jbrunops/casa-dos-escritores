import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                async get(name) {
                    try {
                        // Usando o método adequado para obter cookies
                        // sem usar await diretamente no cookieStore.get()
                        const cookieList = cookieStore.getAll();
                        const cookie = cookieList.find((c) => c.name === name);
                        return cookie?.value;
                    } catch (error) {
                        console.error(`Erro ao obter cookie ${name}:`, error);
                        return null;
                    }
                },
                async set(name, value, options) {
                    try {
                        cookieStore.set({
                            name,
                            value,
                            ...options,
                        });
                    } catch (error) {
                        console.error(`Erro ao definir cookie ${name}:`, error);
                    }
                },
                async remove(name, options) {
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
