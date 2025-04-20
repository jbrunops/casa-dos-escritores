"use client";

import { createBrowserClient as createClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

// Definir o tipo de retorno explicitamente
export function createBrowserClient(): SupabaseClient {
    // Garantir que as variáveis de ambiente são strings
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL ou Anon Key não definidos nas variáveis de ambiente.");
    }

    return createClient(supabaseUrl, supabaseAnonKey);
} 