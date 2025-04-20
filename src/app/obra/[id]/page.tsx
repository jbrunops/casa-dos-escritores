import Link from 'next/link';
import { notFound } from 'next/navigation';
import { extractIdFromSlug, generateSlug } from '@/lib/utils';
import { BookOpen, User, Calendar, Edit, Trash2, Type } from 'lucide-react'; 
import ObraDetailsClient from '@/components/ObraDetailsClient'; 
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Metadata } from 'next';
import * as React from 'react';
// import { Database } from '@/types/supabase'; // Removido temporariamente

// Tipagem para os parâmetros da rota
interface ObraPageParams {
    id: string; // O slug que contém o ID
}

// Tipagem para os props da página
interface ObraPageProps {
    params: ObraPageParams;
}

// Tipagem para dados da Obra/Série 
interface ObraData {
    id: string; // Ajustado para string
    title: string;
    description?: string | null;
    cover_url?: string | null;
    genre?: string | null;
    tags?: string[] | null; 
    is_completed?: boolean | null;
    created_at: string;
    author_id: string; 
    work_type: 'SERIES' | 'STORY' | string;
}

// Tipagem para dados do Capítulo
interface ChapterData {
    id: string; // Ajustado para string
    title: string;
    chapter_number: number;
}

// Tipagem para dados do Perfil do Autor
interface AuthorProfileData {
    id: string;
    username: string;
    avatar_url?: string | null;
}

// Função para criar cliente Supabase Server (Nova tentativa de correção cookies)
const createSupabaseServerClient = () => {
    const cookieStore = cookies(); // Chamar cookies() para obter o store

    // Definir as funções de cookie separadamente
    const getCookie = (name: string) => {
        return cookieStore.get(name)?.value;
    };
    const setCookie = (name: string, value: string, options: CookieOptions) => {
        try {
            cookieStore.set({ name, value, ...options });
        } catch (error) {
            console.warn(`Erro ao setar cookie \"${name}\" em Server Component:`, error);
        }
    };
    const removeCookie = (name: string, options: CookieOptions) => {
        try {
            cookieStore.set({ name, value: '', ...options });
        } catch (error) {
            console.warn(`Erro ao remover cookie \"${name}\" em Server Component:`, error);
        }
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Variáveis de ambiente Supabase não configuradas.");
    }

    return createServerClient(
        supabaseUrl, 
        supabaseAnonKey, 
        {
            cookies: {
                // Usar as funções definidas acima
                get: getCookie,
                set: setCookie,
                remove: removeCookie,
            },
        }
    );
};

// Metadata para a página da obra
export async function generateMetadata({ params }: ObraPageProps): Promise<Metadata> {
    let id: string | number | null = null;
    try {
        const slug = params.id;
        const extractedId = extractIdFromSlug(slug);
        id = extractedId || slug; 

        if (!id) {
            console.warn("Metadata Obra: ID inválido ou não extraído do slug:", slug);
             return { title: "Obra inválida - Casa dos Escritores" };
        }

        const supabase = createSupabaseServerClient();

        const { data: obra, error } = await supabase
            .from('series') 
            .select('id, title')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error(`Metadata Obra: Erro ao buscar obra ID '${id}':`, error.message);
            return { title: "Erro ao carregar obra - Casa dos Escritores" };
        }

        if (!obra) {
            console.warn(`Metadata Obra: Obra não encontrada para ID '${id}', Slug: '${params.id}'`);
            return { title: "Obra não encontrada - Casa dos Escritores" };
        }

        return {
            title: `${obra.title || 'Obra sem título'} - Casa dos Escritores`,
        };
    } catch (err: any) {
        console.error("Erro inesperado ao gerar metadata da obra:", { 
            error: err?.message || err, 
            id: id || params?.id,
            params 
        });
        return { title: "Obra - Casa dos Escritores" };
    }
}

// Componente da Página da Obra (Server Component)
export default async function ObraPage({ params }: ObraPageProps): Promise<React.ReactElement> {
    let id: string | number | null = null; 
    try {
        const slug = params.id;
        const extractedId = extractIdFromSlug(slug); 
        id = extractedId || slug;

        if (!id) {
             console.error("ObraPage: ID inválido ou não extraído do slug:", slug);
             notFound();
        }
        
        const queryId = id;

        const supabase = createSupabaseServerClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
         if (userError) {
             console.warn("ObraPage: Erro ao buscar usuário (não crítico):", userError.message);
         }
        const userId: string | undefined = user?.id;

        // 1. Buscar detalhes base da obra
        const { data: obraResult, error: obraError } = await supabase
            .from('series')
            .select<string, ObraData>(
                `id,
                title,
                description,
                cover_url,
                genre,
                tags,
                is_completed,
                created_at,
                author_id,
                work_type`
            )
            .eq('id', queryId)
            .single();

        if (obraError) {
             if (obraError.code === 'PGRST116') {
                 console.warn(`ObraPage: Obra com ID '${queryId}' não encontrada.`);
                 notFound();
             } else {
                 console.error(`ObraPage: Erro ao buscar dados base da obra ID '${queryId}':`, obraError.message);
                 throw new Error(`Falha ao carregar dados da obra: ${obraError.message}`);
             }
        }
        
        const obra: ObraData = {
             ...obraResult,
             id: String(obraResult.id)
        };

        if (!obra.author_id) {
            console.error(`ObraPage: Obra com ID '${obra.id}' encontrada mas sem author_id.`);
            notFound(); 
        }

        const isAuthor: boolean = !!userId && userId === obra.author_id;

        // 2. Buscar perfil do autor
        const { data: authorProfileResult, error: profileError } = await supabase
            .from('profiles')
            .select<string, AuthorProfileData>('id, username, avatar_url')
            .eq('id', obra.author_id)
            .single();

        if (profileError) {
             if (profileError.code === 'PGRST116') {
                 console.error(`ObraPage: Perfil do autor ID '${obra.author_id}' não encontrado para a obra '${obra.id}'.`);
                 notFound();
             } else {
                 console.error(`ObraPage: Erro ao buscar perfil do autor ID '${obra.author_id}':`, profileError.message);
                 throw new Error(`Falha ao carregar perfil do autor: ${profileError.message}`);
             }
        }

        const authorProfile: AuthorProfileData = {
             ...authorProfileResult,
             id: String(authorProfileResult.id)
        };
        
        // 3. Buscar capítulos da obra
        const { data: chaptersResult, error: chaptersError } = await supabase
            .from('chapters')
            .select<string, { id: string | number; title: string; chapter_number: number; }>('id, title, chapter_number')
            .eq('series_id', obra.id)
            .order('chapter_number', { ascending: true });

        if (chaptersError) {
            console.warn(`ObraPage: Erro ao buscar capítulos da obra ID '${obra.id}' (não crítico):`, chaptersError.message);
        }
        
        const chapters: ChapterData[] = (chaptersResult || []).map(ch => ({
            ...ch,
            id: String(ch.id)
        }));

        return (
             <ObraDetailsClient 
                obraData={obra}
                chaptersData={chapters}
                authorProfileData={authorProfile}
                isAuthor={isAuthor} 
             />
        );

    } catch (error: any) {
        console.error("ObraPage: Erro GERAL não capturado anteriormente:", { 
            error: error?.message || error,
            id: id || params?.id, 
            params
        });
        notFound();
    }
} 