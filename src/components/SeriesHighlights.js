// src/components/SeriesHighlights.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Book, ChevronRight } from "lucide-react";
import { generateSlug } from "@/lib/utils";

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
            <div className="series-highlights-loading">
                <div className="loader-large"></div>
                <p>Carregando séries populares...</p>
            </div>
        );
    }

    if (series.length === 0) {
        return null; // Não mostrar seção se não houver séries
    }

    return (
        <section className="series-highlights-section">
            <div className="section-header">
                <h2>
                    <Book className="section-icon" size={22} />
                    <span>Séries em Destaque</span>
                </h2>
                <Link href="/series" className="view-all-link">
                    <span>Ver Todas</span>
                    <ChevronRight size={16} />
                </Link>
            </div>

            <div className="series-highlights-grid">
                {series.map((serie) => (
                    <Link
                        href={`/series/${generateSlug(serie.title, serie.id)}`}
                        key={serie.id}
                        className="series-highlight-card"
                    >
                        <div className="series-card-image">
                            {serie.cover_url ? (
                                <img
                                    src={serie.cover_url}
                                    alt={serie.title}
                                    className="series-cover-image"
                                />
                            ) : (
                                <div className="series-cover-placeholder">
                                    {serie.title.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="series-card-content">
                            <h3 className="series-title">{serie.title}</h3>
                            <p className="series-author">
                                por {serie.author_name}
                            </p>
                            <div className="series-meta">
                                <span className="series-chapters">
                                    {serie.chapter_count}{" "}
                                    {serie.chapter_count === 1
                                        ? "capítulo"
                                        : "capítulos"}
                                </span>
                                {serie.genre && (
                                    <span className="series-genre">
                                        {serie.genre}
                                    </span>
                                )}
                            </div>
                            <div className="series-stats">
                                <span className="series-views">
                                    {serie.view_count.toLocaleString("pt-BR")}{" "}
                                    visualizações
                                </span>
                                <span className="series-status">
                                    {serie.is_completed
                                        ? "Completa"
                                        : "Em andamento"}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
