// src/components/SeriesHighlights.js
// REMOVIDO: "use client";

// REMOVIDO: import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SeriesCard from "./SeriesCard";

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
        // Buscar as 6 séries mais visualizadas (agora lg:grid-cols-6)
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
            .limit(6);

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
        <section className="pb-6 border-b border-[#D7D7D7]">
            <div className="max-w-[75rem] mx-auto px-4 md:px-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-extrabold text-black relative">
                        Séries em Destaque
                        {/* Mantido span visual */}
                        <span className="block h-1 w-48 mt-2 bg-gradient-to-r from-[#484DB5] to-[#484DB5]/20 rounded-full animate-pulse"></span> 
                    </h2>
                    <Link href="/series" className="flex items-center text-[#484DB5] hover:underline">
                        <span>Ver Todas</span>
                        <ChevronRight size={16} className="ml-1" />
                    </Link>
                </div>

                {/* Aplicando 6 colunas a partir de lg, e ajustando gap a partir de lg */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-2">
                    {seriesWithDetails.map((serie, index) => (
                        <SeriesCard 
                            key={serie.id}
                            serie={serie}
                            index={index}
                            showRanking={true}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
