"use client";

import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;
let initializationError = null;
let initializationAttempted = false;

/**
 * Cria ou retorna um cliente Supabase singleton para uso no navegador
 * Com mecanismos robustos de detecção de erros e debug
 */
export const createBrowserClient = () => {
    // Se já temos uma instância, retorna ela
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Se já tentamos inicializar e falhou, não tente novamente
    if (initializationAttempted && initializationError) {
        console.error("❌ Erro anterior ao inicializar Supabase:", initializationError);
        return null;
    }

    try {
        initializationAttempted = true;

        // Obter variáveis de ambiente do processo (Next.js as expõe ao cliente se prefixadas com NEXT_PUBLIC_)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("❌ URL ou chave do Supabase não definidas no ambiente");
            throw new Error("Configurações do Supabase não encontradas");
        }

        console.log("🔑 Inicializando cliente Supabase com:", { 
            url: supabaseUrl.substring(0, 20) + "...",
            key: supabaseKey.substring(0, 5) + "..." 
        });

        // Inicializar cliente com opções mais robustas
        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 2
                }
            },
            global: {
                fetch: (...args) => fetch(...args)
            }
        });

        // Verificar se o cliente realmente funciona com uma chamada simples
        supabaseInstance.from('profiles').select('count').limit(1)
            .then(({ error }) => {
                if (error) {
                    console.error("⚠️ Alerta: Cliente Supabase inicializado, mas teste de conexão falhou:", error);
                } else {
                    console.log("✅ Cliente Supabase inicializado e testado com sucesso");
                }
            })
            .catch(err => {
                console.error("⚠️ Alerta: Cliente Supabase inicializado, mas teste de conexão falhou:", err);
            });

        return supabaseInstance;
    } catch (error) {
        console.error("❌ Erro fatal ao inicializar cliente Supabase:", error);
        initializationError = error;
        return null;
    }
};

/**
 * Força a reinicialização do cliente Supabase
 */
export const resetSupabaseClient = () => {
    supabaseInstance = null;
    initializationError = null;
    initializationAttempted = false;
    console.log("🔄 Cliente Supabase reinicializado");
    return createBrowserClient();
};