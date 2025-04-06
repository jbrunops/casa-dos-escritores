"use client";

import { createBrowserClient as createClient } from "@supabase/ssr";

export function createBrowserClient() {
    // Definir valores padrão para garantir que o cliente seja sempre criado
    // Mesmo que as variáveis não estejam disponíveis
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkykesdoqdeagnuvlxao.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk";
    
    // Verificação adicional para depuração
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase: Usando valores padrão porque as variáveis de ambiente não foram carregadas corretamente.');
    }
    
    try {
        // Criar o cliente com tratamento de erros
        const client = createClient(
            supabaseUrl,
            supabaseKey
        );
        
        return client;
    } catch (error) {
        console.error("Erro ao criar cliente Supabase:", error);
        // Em caso de erro, retornar um cliente com valores padrão
        // para evitar erros de aplicação
        return createClient(
            "https://kkykesdoqdeagnuvlxao.supabase.co",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk"
        );
    }
}