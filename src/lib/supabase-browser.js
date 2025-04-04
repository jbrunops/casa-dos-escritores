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
        
        // Valores de fallback (usado tanto para desenvolvimento quanto para produção, se necessário)
        const fallbackUrl = "https://kkykesdoqdeagnuvlxao.supabase.co";
        const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk";
        
        return createClient(
            fallbackUrl,
            fallbackKey
        );
    }
    
    return createClient(
        supabaseUrl,
        supabaseKey
    );
}