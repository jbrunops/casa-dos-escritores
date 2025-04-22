// src/components/SeriesHighlights.js
// REMOVIDO: "use client";

// REMOVIDO: import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // ADICIONADO: Importar Image
// REMOVIDO: import { createBrowserClient } from "@/lib/supabase-browser";
import { createServerSupabaseClient } from "@/lib/supabase-server"; // ADICIONADO: Importar cliente do servidor
import { Book, ChevronRight } from "lucide-react";
import { generateSlug } from "@/lib/utils";

// ADICIONADO: tornar async
export default async function SeriesHighlights() {
    // REMOVIDO: Estados useState
    // const [series, setSeries] = useState([]);
    // const [loading, setLoading] = useState(true);

    // ADICIONADO: Buscar dados no servidor
    const supabase = await createServerSupabaseClient();
    let seriesWithDetails = []; // Renomeado para clareza

    try {
        console.log("[Server] Buscando séries populares para Highlights");
        // Buscar as 5 séries mais visualizadas, incluindo dados do autor
        const { data: initialSeries, error: seriesError } = await supabase
            .from("series_with_author")
            .select(
                `
                id,
                title,
                cover_url,
                genre,
                view_count,
                is_completed,
                author_id,
                author_name
              `
            )
            .order("view_count", { ascending: false })
            .limit(5);

        if (seriesError) {
            console.error("[Server] Erro na consulta das séries (Highlights):", seriesError);
            // Retorna null em caso de erro, como o componente fazia antes (após o finally)
            return null;
        }

        // Se não há dados, definir array vazio e retornar null
        if (!initialSeries || initialSeries.length === 0) {
            console.log("[Server] Nenhuma série encontrada para Highlights");
            return null;
        }

        console.log("[Server] Séries encontradas (Highlights):", initialSeries.length);

        // Extrair IDs das séries para buscar contagem de capítulos em lote
        const seriesIds = initialSeries.map(s => s.id);

        // Buscar contagem de capítulos em lote
        const { data: chapterCounts, error: countError } = await supabase
            .from('chapters')
            .select('series_id, id', { count: 'exact', head: false })
            .in('series_id', seriesIds);

        if (countError) {
            console.warn("[Server] Erro ao contar capítulos em lote (Highlights):", countError);
            // Continuar mesmo com erro na contagem, definindo 0 para todos?
            // Ou retornar null? Vamos definir 0 por enquanto.
        }

        // Mapear contagens para fácil acesso
        const countsMap = chapterCounts?.reduce((acc, { series_id }) => {
            acc[series_id] = (acc[series_id] || 0) + 1;
            return acc;
        }, {}) || {};

        // Combinar dados
        seriesWithDetails = initialSeries.map(serie => ({
            ...serie,
            chapter_count: countsMap[serie.id] || 0,
        }));

    } catch (error) {
        console.error("[Server] Erro geral ao buscar séries populares (Highlights):", error);
        return null; // Retornar null em caso de erro inesperado
    }

    // REMOVIDO: Lógica de useEffect
    // REMOVIDO: Estado de loading e return condicional

    // Se chegou aqui e seriesWithDetails está vazio (pouco provável devido às checagens anteriores, mas por segurança)
    if (seriesWithDetails.length === 0) {
        return null; // Não mostrar seção se não houver séries
    }

    return (
        <section className="py-8">
            <div className="max-w-[75rem] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-extrabold text-black relative">
                        Séries em Destaque
                        {/* Mantido span visual */}
                        <span className="block h-1 w-64 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span> 
                    </h2>
                    <Link href="/series" className="flex items-center text-[#484DB5] hover:underline">
                        <span>Ver Todas</span>
                        <ChevronRight size={16} className="ml-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {/* Usar seriesWithDetails */} 
                    {seriesWithDetails.map((serie, index) => (
                        <Link
                            // MUDADO: Usar generateSlug com ID
                            href={`/series/${serie.id}`}
                            key={serie.id}
                            className="flex flex-col rounded-lg border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow bg-white"
                        >
                            <div className="relative w-full pt-[150%]"> 
                                {index === 0 ? (
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-sm font-bold rounded z-10">
                                        #1
                                    </div>
                                ) : (
                                    <div className="absolute top-2 left-2 bg-[#484DB5] text-white px-2 py-1 text-sm font-bold rounded z-10">
                                        #{index + 1}
                                    </div>
                                )}
                                {serie.cover_url ? (
                                    // SUBSTITUÍDO: img por Image
                                    <Image
                                        src={serie.cover_url}
                                        alt={serie.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                        className="object-cover" // Mantém object-cover
                                        priority={index === 0} // Adicionado priority para a primeira imagem
                                    />
                                ) : (
                                    // MANTIDO: Fallback visual
                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#484DB5] text-white text-4xl font-bold">
                                        {serie.title.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex-grow flex flex-col">
                                <h3 className="font-bold text-base line-clamp-2 mb-1">{serie.title}</h3>
                                <p className="text-xs text-gray-600 mb-2">
                                    de {serie.author_name} {/* Usar author_name populado */}
                                </p>
                                {serie.genre && (
                                    <div className="mb-2">
                                        <span className="text-xs text-[#484DB5] font-medium">
                                            › {serie.genre}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-auto flex items-center justify-between text-xs text-gray-600">
                                    {/* Mantida estrutura visual dos ícones */}
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {serie.view_count.toLocaleString("pt-BR")}
                                    </div>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {serie.chapter_count} {/* Usar chapter_count populado */}
                                    </div>
                                    <span className="text-xs text-[#484DB5] bg-purple-100 px-2 py-0.5 rounded">
                                        {serie.is_completed ? "Completa" : "escrevendo..."}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
