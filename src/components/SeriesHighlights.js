// src/components/SeriesHighlights.js
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Book, Eye, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function SeriesHighlights() {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef(null);
    const supabase = createBrowserClient();

    // Número de cards visíveis dependendo do tamanho da tela
    const getVisibleCards = () => {
        if (typeof window === 'undefined') return 1;
        if (window.innerWidth < 640) return 1;
        if (window.innerWidth < 1024) return 2;
        if (window.innerWidth < 1280) return 3;
        return 4;
    };

    const [visibleCards, setVisibleCards] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            setVisibleCards(getVisibleCards());
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        async function fetchPopularSeries() {
            try {
                setLoading(true);
                // Buscar até 10 séries mais visualizadas
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
                        author_id,
                        created_at
                      `
                    )
                    .order("view_count", { ascending: false })
                    .limit(10);

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

                // Buscar autores e contagem de capítulos
                const seriesWithDetails = await Promise.all(
                    data.map(async (serie) => {
                        // Buscar autor
                        const { data: author } = await supabase
                            .from("profiles")
                            .select("username")
                            .eq("id", serie.author_id)
                            .single();

                        // Buscar contagem de capítulos
                        const { count } = await supabase
                            .from("chapters")
                            .select("*", { count: "exact" })
                            .eq("series_id", serie.id);

                        return {
                            ...serie,
                            author_name: author?.username || "Autor desconhecido",
                            chapter_count: count || 0,
                        };
                    })
                );

                setSeries(seriesWithDetails);
            } catch (error) {
                console.error("Erro ao buscar séries populares:", error);
                setSeries([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPopularSeries();
    }, []);

    const nextSlide = () => {
        if (currentIndex < series.length - visibleCards) {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prevIndex => prevIndex - 1);
        }
    };

    // Formatar contagem em formato legível (ex: 1.2k)
    const formatCount = (count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1).replace('.0', '')}k`;
        }
        return count.toString();
    };

    // Se está carregando, mostrar spinner
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#484DB5] rounded-full animate-spin"></div>
            </div>
        );
    }

    // Se não há séries, não mostrar nada
    if (series.length === 0) {
        return null;
    }

    return (
        <section className="py-8">
            <div className="flex items-center justify-between max-w-[75rem] mx-auto px-4 mb-6">
                <h2 className="text-[1.8rem] font-bold mb-4 relative">
                    Séries em Destaque
                    <div className="w-[8.6rem] h-[3px] bg-[#484DB5] mt-2 title-line"></div>
                </h2>
                <Link href="/series" className="flex items-center text-[#484DB5] hover:text-[#7A80FB] font-medium">
                    <span>Ver Todas</span>
                    <ChevronRight size={16} className="ml-1" />
                </Link>
            </div>

            <div className="series-carousel-container px-4">
                {currentIndex > 0 && (
                    <button 
                        onClick={prevSlide} 
                        className="carousel-button carousel-button-prev"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                
                <div 
                    className="series-carousel" 
                    ref={carouselRef}
                    style={{ 
                        transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
                        width: `${(series.length / visibleCards) * 100}%` 
                    }}
                >
                    {series.map((serie, index) => (
                        <Link
                            key={serie.id}
                            href={`/series/${generateSlug(serie.title, serie.id)}`}
                            className="series-card"
                        >
                            <div className="series-card-rank">
                                #{index + 1}
                            </div>
                            {serie.is_completed && (
                                <span className="series-card-badge">
                                    Completa
                                </span>
                            )}
                            <div className="series-card-image">
                                {serie.cover_url ? (
                                    <img 
                                        src={serie.cover_url} 
                                        alt={serie.title} 
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#EEF0FF] flex items-center justify-center">
                                        <BookOpen size={48} className="text-[#484DB5] opacity-50" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="series-card-content">
                                <h3 className="series-card-title">{serie.title}</h3>
                                <p className="series-card-author">por {serie.author_name}</p>
                                {serie.genre && (
                                    <p className="series-card-genre">{serie.genre}</p>
                                )}
                                
                                <div className="series-card-stats">
                                    <div className="series-card-stat">
                                        <Eye size={16} />
                                        <span>{formatCount(serie.view_count)}</span>
                                    </div>
                                    <div className="series-card-stat">
                                        <Book size={16} />
                                        <span>{serie.chapter_count}</span>
                                    </div>
                                    {!serie.is_completed && (
                                        <div className="series-card-status">
                                            em andamento
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                
                {currentIndex < series.length - visibleCards && (
                    <button 
                        onClick={nextSlide} 
                        className="carousel-button carousel-button-next"
                        aria-label="Próximo"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </section>
    );
}
