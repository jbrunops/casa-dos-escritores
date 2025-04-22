'use server';

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
                        const cookie = await cookieStore.get(name);
                        return cookie?.value;
                    } catch (error) {
                        console.error(`Erro ao obter cookie ${name}:`, error);
                        return null;
                    }
                },
                async set(name, value, options) {
                    try {
                        if (typeof cookieStore.set === 'function') {
                            await cookieStore.set({
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
                async remove(name, options) {
                    try {
                        if (typeof cookieStore.set === 'function') {
                            await cookieStore.set({
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
