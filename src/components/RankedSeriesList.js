"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SeriesCard from "./SeriesCard";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function RankedSeriesList({ 
    title, 
    orderByField = "view_count",
    orderByAscending = false,
    limit = 8,
    initialData = [] // Para SSR, podemos passar dados iniciais
}) {
    const [seriesWithDetails, setSeriesWithDetails] = useState(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);

    useEffect(() => {
        const fetchData = async () => {
            if (initialData.length > 0) {
                return; // Se já temos dados iniciais, não precisamos buscar novamente
            }

            setLoading(true);
            const supabase = createBrowserClient();
            
            try {
                console.log(`Buscando séries para a seção "${title}" ordenadas por ${orderByField}`);
                
                const { data: initialSeries, error: seriesError } = await supabase
                    .from("series_with_author")
                    .select(`
                        id,
                        title,
                        cover_url,
                        genre,
                        view_count,
                        is_completed,
                        author_id,
                        author_name,
                        created_at
                    `)
                    .order(orderByField, { ascending: orderByAscending })
                    .limit(limit);

                if (seriesError) {
                    console.error(`Erro na consulta das séries ("${title}"):`, seriesError);
                    setLoading(false);
                    return;
                }

                if (!initialSeries || initialSeries.length === 0) {
                    console.log(`Nenhuma série encontrada para "${title}"`);
                    setLoading(false);
                    return;
                }

                console.log(`Séries encontradas ("${title}"):`, initialSeries.length);

                const seriesIds = initialSeries.map(s => s.id);

                const { data: chapterCounts, error: countError } = await supabase
                    .from('chapters')
                    .select('series_id, id', { count: 'exact', head: false })
                    .in('series_id', seriesIds);

                if (countError) {
                    console.warn(`Erro ao contar capítulos em lote ("${title}"):`, countError);
                }

                const countsMap = chapterCounts?.reduce((acc, { series_id }) => {
                    acc[series_id] = (acc[series_id] || 0) + 1;
                    return acc;
                }, {}) || {};

                const seriesData = initialSeries.map(serie => ({
                    ...serie,
                    chapter_count: countsMap[serie.id] || 0,
                }));

                setSeriesWithDetails(seriesData);
            } catch (error) {
                console.error(`Erro geral ao buscar séries ("${title}"):`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [title, orderByField, orderByAscending, limit, initialData]);

    // Determinar o link "Ver Todos" 
    const viewAllLink = "/series";

    if (loading) {
        return (
            <section>
                <div className="max-w-[75rem] mx-auto px-4 md:px-0">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5">
                        {Array(limit).fill(0).map((_, index) => (
                            <div key={index} className="rounded-lg overflow-hidden bg-gray-200 animate-pulse">
                                <div className="w-full pt-[150%]"></div>
                                <div className="p-3">
                                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (seriesWithDetails.length === 0) {
        return null;
    }

    return (
        <section>
            <div className="max-w-[75rem] mx-auto px-4 md:px-0">
                <motion.div 
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Cabeçalho com título e botão "Ver Todas" */}
                    <div className="flex items-center">
                        <h2 className="text-2xl font-extrabold text-black relative">
                            {title} 
                            <motion.span 
                                className="block h-1 w-48 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "12rem" }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            ></motion.span>
                        </h2>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Link 
                            href={viewAllLink} 
                            className="flex items-center text-[#484DB5] hover:text-[#484DB5]/80 transition-colors px-4 py-2 rounded-full hover:bg-[#484DB5]/10"
                        >
                            <span className="font-medium">Ver Todas</span>
                            <ChevronRight size={18} className="ml-1" />
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Grid de cards com espaçamento melhorado */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5">
                    {seriesWithDetails.map((serie, index) => (
                        <SeriesCard 
                            key={serie.id}
                            serie={serie}
                            index={index}
                            showRanking={orderByField === 'view_count'}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
} 