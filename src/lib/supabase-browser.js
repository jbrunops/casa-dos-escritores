"use client";

import { createBrowserClient as createClient } from "@supabase/ssr";

export function createBrowserClient() {
    // process.env só funciona no cliente se as variáveis começarem com NEXT_PUBLIC_
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Verificação adicional para depuração
    if (!supabaseUrl || !supabaseKey) {
        console.error('Variáveis de ambiente do Supabase não foram carregadas corretamente:');
        console.error('URL:', supabaseUrl ? 'Definida' : 'Não definida');
        console.error('KEY:', supabaseKey ? 'Definida' : 'Não definida');
        
        // Usar os valores das variáveis ambiente se estiverem disponíveis, mesmo que pareçam vazios
        // Isso evita o uso de fallbacks potencialmente inválidos
        return createClient(
            supabaseUrl || "",
            supabaseKey || ""
        );
    }
    
    return createClient(
        supabaseUrl,
        supabaseKey
    );
}