"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Card from "@/components/Card";
import { generateSlug } from "@/lib/utils";
import Link from "next/link";

export default function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    
    const [results, setResults] = useState({ series: [], stories: [], chapters: [] });
    const [loading, setLoading] = useState(true);
    const [resultCount, setResultCount] = useState(0);
    const supabase = createBrowserClient();
    
    useEffect(() => {
        async function fetchResults() {
            if (!query || query.trim() === "") {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            
            try {
                // Pesquisar séries
                const { data: seriesData, error: seriesError } = await supabase
                    .from("series")
                    .select(`
                        id, 
                        title, 
                        cover_url, 
                        genre, 
                        view_count, 
                        is_completed, 
                        author_id, 
                        profiles(username)
                    `)
                    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                    .limit(10);
                    
                if (seriesError) console.error("Erro ao pesquisar séries:", seriesError);
                
                // Pesquisar histórias individuais
                const { data: storiesData, error: storiesError } = await supabase
                    .from("stories")
                    .select(`
                        id, 
                        title, 
                        cover_url,
                        genre,
                        view_count,
                        author_id,
                        profiles(username)
                    `)
                    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                    .limit(10);
                    
                if (storiesError) console.error("Erro ao pesquisar histórias:", storiesError);
                
                // Pesquisar capítulos
                const { data: chaptersData, error: chaptersError } = await supabase
                    .from("chapters")
                    .select(`
                        id,
                        title,
                        series_id,
                        series(title, cover_url),
                        view_count,
                        author_id,
                        profiles(username)
                    `)
                    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                    .limit(10);
                    
                if (chaptersError) console.error("Erro ao pesquisar capítulos:", chaptersError);
                
                // Processar e configurar resultados
                const processedSeries = seriesData ? seriesData.map(series => ({
                    ...series,
                    author_name: series.profiles ? series.profiles.username : "Autor desconhecido"
                })) : [];
                
                const processedStories = storiesData ? storiesData.map(story => ({
                    ...story,
                    author_name: story.profiles ? story.profiles.username : "Autor desconhecido" 
                })) : [];
                
                const processedChapters = chaptersData ? chaptersData.map(chapter => ({
                    ...chapter,
                    author_name: chapter.profiles ? chapter.profiles.username : "Autor desconhecido",
                    series_title: chapter.series ? chapter.series.title : "",
                    cover_url: chapter.series ? chapter.series.cover_url : null
                })) : [];
                
                setResults({
                    series: processedSeries || [],
                    stories: processedStories || [],
                    chapters: processedChapters || []
                });
                
                setResultCount(
                    (processedSeries?.length || 0) + 
                    (processedStories?.length || 0) + 
                    (processedChapters?.length || 0)
                );
            } catch (error) {
                console.error("Erro ao realizar pesquisa:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchResults();
    }, [query]);
    
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Resultados para: {query}</h1>
            
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {resultCount === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-6">Nenhum resultado encontrado para "{query}"</p>
                            <Link href="/" className="text-purple-600 hover:text-purple-800">
                                Voltar para a página inicial
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Resultados de Séries */}
                            {results.series.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Séries</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {results.series.map(serie => (
                                            <Card 
                                                key={`series-${serie.id}`}
                                                title={serie.title}
                                                author={serie.author_name}
                                                coverUrl={serie.cover_url}
                                                href={`/series/${generateSlug(serie.title, serie.id)}`}
                                                badges={serie.genre ? [serie.genre] : []}
                                                footerLeft={`${serie.view_count || 0} visualizações`}
                                                footerRight={{
                                                    text: serie.is_completed ? "Completa" : "Em andamento",
                                                    color: serie.is_completed ? "text-green-600" : "text-amber-600"
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Resultados de Histórias */}
                            {results.stories.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Histórias</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {results.stories.map(story => (
                                            <Card 
                                                key={`story-${story.id}`}
                                                title={story.title}
                                                author={story.author_name}
                                                coverUrl={story.cover_url}
                                                href={`/story/${generateSlug(story.title, story.id)}`}
                                                badges={story.genre ? [story.genre] : []}
                                                footerLeft={`${story.view_count || 0} visualizações`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Resultados de Capítulos */}
                            {results.chapters.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Capítulos</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {results.chapters.map(chapter => (
                                            <Card 
                                                key={`chapter-${chapter.id}`}
                                                title={chapter.title}
                                                author={chapter.author_name}
                                                coverUrl={chapter.cover_url}
                                                href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                                                stats={[`Da série: ${chapter.series_title}`]}
                                                footerLeft={`${chapter.view_count || 0} visualizações`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
