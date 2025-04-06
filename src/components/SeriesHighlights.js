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
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef(null);
    const supabaseRef = useRef(null);

    // Inicializar o cliente Supabase apenas uma vez
    if (!supabaseRef.current) {
        supabaseRef.current = createBrowserClient();
    }

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
        let isMounted = true;
        let timeoutId = null;
        
        async function fetchPopularSeries() {
            try {
                if (isMounted) {
                    setLoading(true);
                    setError(null); // Resetar o erro ao iniciar uma nova busca
                }
                
                // Usar o cliente armazenado na ref para evitar recriações
                const supabase = supabaseRef.current;
                
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
                    if (isMounted) {
                        setError("Não foi possível carregar as séries em destaque");
                        setLoading(false);
                    }
                    return;
                }

                // Se não há dados, definir array vazio
                if (!data || data.length === 0) {
                    console.log("Nenhuma série encontrada");
                    if (isMounted) {
                        setSeries([]);
                        setLoading(false);
                    }
                    return;
                }

                // Para evitar longos tempos de carregamento, primeiro exibimos os dados básicos
                if (isMounted) {
                    setSeries(data.map(serie => ({
                        ...serie,
                        author_name: "Carregando...",
                        chapter_count: 0
                    })));
                }
                
                // Depois buscamos os detalhes adicionais - com catch para cada série individual
                const seriesWithDetails = await Promise.all(
                    data.map(async (serie) => {
                        // Buscar autor
                        let authorName = "Autor desconhecido";
                        try {
                            const { data: author } = await supabase
                                .from("profiles")
                                .select("username")
                                .eq("id", serie.author_id)
                                .single();
                                
                            if (author && author.username) {
                                authorName = author.username;
                            }
                        } catch (authorError) {
                            console.error("Erro ao buscar autor:", authorError);
                        }

                        // Buscar contagem de capítulos
                        let chapterCount = 0;
                        try {
                            const { count } = await supabase
                                .from("chapters")
                                .select("*", { count: "exact" })
                                .eq("series_id", serie.id);
                                
                            if (count !== null && count !== undefined) {
                                chapterCount = count;
                            }
                        } catch (chapterError) {
                            console.error("Erro ao buscar capítulos:", chapterError);
                        }

                        return {
                            ...serie,
                            author_name: authorName,
                            chapter_count: chapterCount,
                        };
                    })
                ).catch(e => {
                    console.error("Erro ao processar detalhes das séries:", e);
                    // Retornar os dados básicos em caso de erro
                    return data.map(serie => ({
                        ...serie, 
                        author_name: "Autor desconhecido",
                        chapter_count: 0
                    }));
                });

                if (isMounted && seriesWithDetails) {
                    setSeries(seriesWithDetails);
                    setError(null); // Limpar erro se a busca foi bem-sucedida
                }
            } catch (error) {
                console.error("Erro ao buscar séries populares:", error);
                if (isMounted) {
                    // Não redefinir séries se já temos dados
                    if (series.length === 0) {
                        setError("Erro ao carregar séries");
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchPopularSeries();

        // Definir um timeout para garantir que loading não fique preso
        timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.log("Timeout de carregamento atingido, forçando estado de não-loading");
                setLoading(false);
                // Não definir erro se já temos séries carregadas
                if (series.length === 0) {
                    setError("Tempo limite excedido ao carregar séries");
                }
            }
        }, 8000); // Aumentado para 8 segundos para dar mais tempo

        // Limpar timeout ao desmontar componente
        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
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

    // Se ocorreu um erro E não temos séries, mostrar mensagem
    if (error && series.length === 0) {
        return (
            <section className="py-8">
                <div className="max-w-[75rem] mx-auto px-4">
                    <h2 className="text-[1.8rem] font-bold mb-4 relative">
                        Séries em Destaque
                        <div className="w-[8.6rem] h-[3px] bg-[#484DB5] mt-2 title-line"></div>
                    </h2>
                    <p className="text-gray-500">
                        Não foi possível carregar as séries em destaque. Por favor, tente novamente mais tarde.
                    </p>
                </div>
            </section>
        );
    }

    // Se está carregando e não temos séries ainda, mostrar spinner
    if (loading && series.length === 0) {
        return (
            <section className="py-8">
                <div className="max-w-[75rem] mx-auto px-4">
                    <h2 className="text-[1.8rem] font-bold mb-4 relative">
                        Séries em Destaque
                        <div className="w-[8.6rem] h-[3px] bg-[#484DB5] mt-2 title-line"></div>
                    </h2>
                    <div className="flex items-center justify-center py-8">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#484DB5] rounded-full animate-spin"></div>
                    </div>
                </div>
            </section>
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
                            <div className="series-card-image">
                                {serie.cover_url ? (
                                    <img 
                                        src={serie.cover_url} 
                                        alt={serie.title} 
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#f8f9fe] flex items-center justify-center">
                                        <span className="text-5xl font-bold text-[#484DB5]">
                                            {serie.title.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                {serie.is_completed && (
                                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                                        Completa
                                    </span>
                                )}
                            </div>
                            <div className="p-4 flex-grow flex flex-col">
                                <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">{serie.title}</h3>
                                <div className="text-xs text-gray-500 mb-1">por {serie.author_name}</div>
                                
                                {serie.genre && (
                                    <div className="mb-4">
                                        <span className="text-xs text-[#484DB5]">
                                            {serie.genre}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center mt-auto text-xs text-gray-600">
                                    <div className="flex space-x-4">
                                        <div className="flex items-center">
                                            <Eye className="w-4 h-4 mr-1" />
                                            <span>{formatCount(serie.view_count || 0)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            <span>{serie.chapter_count}</span>
                                        </div>
                                    </div>
                                    
                                    {!serie.is_completed && (
                                        <span className="bg-[#484DB5] text-white text-xs px-2 py-0.5 rounded">
                                            em andamento
                                        </span>
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
