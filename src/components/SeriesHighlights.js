// src/components/SeriesHighlights.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Book, ChevronRight } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import Card from "./Card";

export default function SeriesHighlights() {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchPopularSeries() {
            try {
                setLoading(true);
                console.log("Buscando séries populares");
                // Buscar as 5 séries mais visualizadas
                const { data, error } = await supabase
                    .from("series")
                    .select(
                        `
                        id,
                        title,
                        cover_url,
                        genre,
                        view_count,
                        is_completed,
                        author_id
                      `
                    )
                    .order("view_count", { ascending: false })
                    .limit(5);

                if (error) {
                    console.error("Erro na consulta das séries:", error);
                    setSeries([]);
                    return;
                }

                // Se não há dados, definir array vazio
                if (!data || data.length === 0) {
                    console.log("Nenhuma série encontrada");
                    setSeries([]);
                    return;
                }

                console.log("Séries encontradas:", data.length);

                // Buscar autores para cada série
                const seriesWithAuthors = await Promise.all(
                    data.map(async (serie) => {
                        try {
                            const { data: author } = await supabase
                                .from("profiles")
                                .select("username")
                                .eq("id", serie.author_id)
                                .single();

                            return {
                                ...serie,
                                author_name:
                                    author?.username || "Autor desconhecido",
                            };
                        } catch (err) {
                            console.warn(
                                "Erro ao buscar autor para série:",
                                serie.id,
                                err
                            );
                            return {
                                ...serie,
                                author_name: "Autor desconhecido",
                            };
                        }
                    })
                );

                // Para cada série, buscar contagem de capítulos
                const seriesWithChapters = await Promise.all(
                    seriesWithAuthors.map(async (serie) => {
                        try {
                            const { count, error: countError } = await supabase
                                .from("chapters") // Mudado de stories para chapters
                                .select("*", { count: "exact" })
                                .eq("series_id", serie.id);

                            if (countError) {
                                console.warn(
                                    "Erro ao contar capítulos:",
                                    countError
                                );
                                return {
                                    ...serie,
                                    chapter_count: 0,
                                };
                            }

                            return {
                                ...serie,
                                chapter_count: count || 0,
                            };
                        } catch (err) {
                            console.warn("Exceção ao contar capítulos:", err);
                            return {
                                ...serie,
                                chapter_count: 0,
                            };
                        }
                    })
                );

                setSeries(seriesWithChapters);
            } catch (error) {
                console.error("Erro ao buscar séries populares:", error);
                setSeries([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPopularSeries();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Carregando séries populares...</p>
            </div>
        );
    }

    if (series.length === 0) {
        return null; // Não mostrar seção se não houver séries
    }

    return (
        <section className="py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[1.8rem] font-bold mb-4 relative">
                    Séries em Destaque
                    <div className="w-[8.6rem] h-[3px] bg-[#484DB5] mt-2 title-line"></div>
                </h2>
                <Link href="/series" className="flex items-center text-[#484DB5] hover:text-[#7A80FB] font-medium">
                    <span>Ver Todas</span>
                    <ChevronRight size={16} className="ml-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {series.map((serie) => (
                    <Card
                        key={serie.id}
                        title={serie.title}
                        author={serie.author_name}
                        coverUrl={serie.cover_url}
                        href={`/series/${generateSlug(serie.title, serie.id)}`}
                        stats={[
                            `${serie.chapter_count} ${
                                serie.chapter_count === 1 ? "capítulo" : "capítulos"
                            }`
                        ]}
                        badges={serie.genre ? [serie.genre] : []}
                        footerLeft={`${serie.view_count.toLocaleString("pt-BR")} visualizações`}
                        footerRight={{
                            text: serie.is_completed ? "Completa" : "Em andamento",
                            color: serie.is_completed ? "text-green-600" : "text-amber-600"
                        }}
                    />
                ))}
            </div>
        </section>
    );
}
