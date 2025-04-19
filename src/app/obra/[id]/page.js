// REMOVIDO: 'use client';

// import React, { useState } from 'react'; // REMOVIDO
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation'; // Mantido notFound
// import { useRouter } from 'next/navigation'; // REMOVIDO
import { extractIdFromSlug, generateSlug, formatDate } from '@/lib/utils';
import { BookOpen, User, Calendar, Edit, Trash2, Type } from 'lucide-react'; 
// import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // REMOVIDO
import ObraDetailsClient from '@/components/ObraDetailsClient'; // <<< Importa o novo componente cliente
// import { deleteObra, deleteChapter } from '@/app/actions/obraActions'; // REMOVIDO daqui, será passado

// Função auxiliar para capitalizar (pode ficar aqui ou em utils)
const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Metadata para a página da obra (Mantida como estava)
export async function generateMetadata({ params }) {
    let id;
    try {
        const slug = await Promise.resolve(params.id);
        id = extractIdFromSlug(slug) || slug;
        const supabase = await createServerSupabaseClient();

        const { data: obra, error } = await supabase
            .from('series') // Assumindo que "obra" é uma "series"
            .select('title')
            .eq('id', id)
            .single();

        if (error || !obra) {
            console.warn(`Metadata Obra: Obra não encontrada para ID '${id}', Slug: '${params.id}'`);
            return { title: "Obra não encontrada - Casa dos Escritores" };
        }

        return {
            title: `${obra.title} - Casa dos Escritores`,
        };
    } catch (error) {
        console.error("Erro inesperado ao gerar metadata da obra:", { error, id, params });
        return { title: "Obra - Casa dos Escritores" };
    }
}

// Componente da Página da Obra (VOLTA A SER ASYNC SERVER COMPONENT)
export default async function ObraPage({ params }) { 
    let id;
    try {
        const slug = await Promise.resolve(params.id);
        id = extractIdFromSlug(slug) || slug;

        console.log("----- DIAGNÓSTICO DE OBRA (Server) -----");
        console.log("Slug recebido da URL:", slug);
        console.log("ID extraído para consulta:", id);

        const supabase = await createServerSupabaseClient();

        // Verificar usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        console.log("ID do usuário logado:", userId || 'Nenhum');

        // 1. Buscar detalhes base da obra (incluindo work_type) - Como estava antes
        const { data: obra, error: obraError } = await supabase
            .from('series')
            .select(
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
            .eq('id', id)
            .single();

        if (obraError || !obra) {
            console.error(`Erro ao buscar dados base da obra com ID '${id}' ou obra não encontrada:`, obraError?.message);
            notFound();
        }

        // Verificar se temos author_id para buscar o perfil
        if (!obra.author_id) {
            console.error(`Obra com ID '${id}' não possui um author_id associado.`);
             notFound(); 
        }

        console.log("Obra (dados base) encontrada:", obra.id, obra.title, "Author ID:", obra.author_id, "Work Type:", obra.work_type);

        // Verificar se o usuário logado é o autor
        const isAuthor = !!userId && userId === obra.author_id;
        console.log("Usuário logado é o autor?", isAuthor);

        // 2. Buscar perfil do autor separadamente
        console.log(`Buscando perfil do autor com ID: ${obra.author_id}`);
        const { data: authorProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', obra.author_id)
            .single();

        if (profileError || !authorProfile) {
            console.error(`Erro ao buscar perfil do autor ID '${obra.author_id}' para a obra '${obra.id}':`, profileError?.message);
            console.error("Não foi possível carregar o perfil do autor. Abortando renderização.");
            notFound();
        }
        
        console.log("Perfil do autor encontrado:", authorProfile.username);

        // 3. Buscar capítulos da obra
        const { data: chapters, error: chaptersError } = await supabase
            .from('chapters')
            .select('id, title, chapter_number')
            .eq('series_id', obra.id)
            .order('chapter_number', { ascending: true });

        if (chaptersError) {
            console.error("Erro ao buscar capítulos da obra:", chaptersError.message);
            // Não crítico
        }

        // --- RENDERIZA O COMPONENTE CLIENTE PASSANDO OS DADOS ---
        return (
             <ObraDetailsClient 
                obraData={obra} 
                chaptersData={chapters || []} 
                authorProfileData={authorProfile} 
                isAuthor={isAuthor} 
                // Passar as Server Actions aqui quando forem criadas
                // deleteObraAction={deleteObra}
                // deleteChapterAction={deleteChapter}
             />
        );

    } catch (error) {
        console.error("Erro GERAL na página da obra (Server Component):", { error, id: id || params.id });
        if (error && error.message) {
            console.error("Mensagem de erro:", error.message);
        }
        if (error?.message?.includes('JSON object requested, multiple (or no) rows returned') || error?.message?.includes('relation \"series\" does not exist')) {
             console.error(`O ID '${id}' provavelmente não corresponde a uma obra (série) válida.`);
        }
        notFound();
    }
}

// REMOVIDO O CONTEÚDO DO RETURN QUE FOI MOVIDO PARA ObraDetailsClient.js 