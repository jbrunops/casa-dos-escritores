import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Pagination from "@/components/Pagination";
import { generateSlug } from "@/lib/utils";

const PAGE_SIZE = 9; // Número de histórias por página

export async function generateMetadata({ params }) {
    // Converter o slug de volta para nome de categoria
    // Decodificar a URL corretamente
    const categoryName = decodeURIComponent(params.category)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return {
        title: `Histórias de ${categoryName}`,
        description: `Explore histórias na categoria ${categoryName}`,
    };
}

export default async function CategoryPage({ params, searchParams }) {
    const supabase = await createServerSupabaseClient();
    const page = searchParams.page ? parseInt(searchParams.page) : 1;

    // Converter o slug de volta para nome de categoria
    // Decodificar a URL corretamente
    const categoryName = decodeURIComponent(params.category)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // Calcular o offset para paginação
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // SEÇÃO 1: Buscar histórias individuais
    let stories = [];
    let storiesWithAuthorInfo = [];
    
    try {
        const {
            data: storiesData,
            count: storiesCount,
            error: storiesError,
        } = await supabase
            .from("stories")
            .select(
                `
                id,
                title,
                content,
                created_at,
                author_id
                `,
                { count: "exact" }
            )
            .eq("is_published", true)
            .ilike("category", categoryName) 
            .order("created_at", { ascending: false });

        if (storiesError) {
            console.error("Erro ao buscar histórias:", storiesError);
        } else {
            stories = storiesData || [];
        }
    } catch (err) {
        console.error("Exceção ao buscar histórias:", err);
    }
    
    // SEÇÃO 2: Buscar autores das histórias
    try {
        if (stories && stories.length > 0) {
            const authorIds = [...new Set(stories.map(story => story.author_id))].filter(Boolean);
            
            if (authorIds.length > 0) {
                try {
                    const { data: authorsData, error: authorsError } = await supabase
                        .from("profiles")
                        .select("id, username")
                        .in("id", authorIds);
                        
                    if (authorsError) {
                        console.error("Erro ao buscar autores das histórias:", authorsError);
                    } else {
                        // Criar um mapa de IDs de autor para nomes de usuário
                        const authorMap = {};
                        authorsData?.forEach(author => {
                            authorMap[author.id] = author.username;
                        });
                        
                        // Adicionar informações de autor a cada história
                        storiesWithAuthorInfo = stories.map(story => ({
                            ...story,
                            authorName: authorMap[story.author_id] || "Autor desconhecido"
                        }));
                    }
                } catch (err) {
                    console.error("Erro ao processar autores de histórias:", err);
                    // Em caso de erro, usar os dados brutos das histórias
                    storiesWithAuthorInfo = stories.map(story => ({
                        ...story,
                        authorName: "Autor desconhecido"
                    }));
                }
            } else {
                // Se não houver IDs de autor válidos, usar os dados brutos
                storiesWithAuthorInfo = stories.map(story => ({
                    ...story,
                    authorName: "Autor desconhecido"
                }));
            }
        }
    } catch (err) {
        console.error("Exceção ao processar autores de histórias:", err);
        storiesWithAuthorInfo = stories.map(story => ({
            ...story,
            authorName: "Autor desconhecido"
        }));
    }

    // SEÇÃO 3: Buscar séries
    let seriesData = [];
    let seriesWithAuthorInfo = [];
    
    try {
        const {
            data: seriesResult,
            count: seriesCount,
            error: seriesError,
        } = await supabase
            .from("series")
            .select(
                `
                id,
                title,
                description,
                created_at,
                genre,
                author_id
                `,
                { count: "exact" }
            )
            .ilike("genre", categoryName)
            .order("created_at", { ascending: false });

        if (seriesError) {
            console.error("Erro ao buscar séries:", seriesError);
        } else {
            seriesData = seriesResult || [];
        }
    } catch (err) {
        console.error("Exceção ao buscar séries:", err);
    }

    // SEÇÃO 4: Buscar autores das séries
    try {
        if (seriesData && seriesData.length > 0) {
            const authorIds = [...new Set(seriesData.map(serie => serie.author_id))].filter(Boolean);
            
            if (authorIds.length > 0) {
                try {
                    const { data: authorsData, error: authorsError } = await supabase
                        .from("profiles")
                        .select("id, username")
                        .in("id", authorIds);
                        
                    if (authorsError) {
                        console.error("Erro ao buscar autores:", authorsError);
                    } else {
                        // Criar um mapa de IDs de autor para nomes de usuário
                        const authorMap = {};
                        authorsData?.forEach(author => {
                            authorMap[author.id] = author.username;
                        });
                        
                        // Adicionar informações de autor a cada série
                        seriesWithAuthorInfo = seriesData.map(serie => ({
                            ...serie,
                            authorName: authorMap[serie.author_id] || "Autor desconhecido"
                        }));
                    }
                } catch (err) {
                    console.error("Erro ao processar autores de séries:", err);
                    // Em caso de erro, usar os dados brutos das séries
                    seriesWithAuthorInfo = seriesData.map(serie => ({
                        ...serie,
                        authorName: "Autor desconhecido"
                    }));
                }
            } else {
                // Se não houver IDs de autor válidos, usar os dados brutos
                seriesWithAuthorInfo = seriesData.map(serie => ({
                    ...serie,
                    authorName: "Autor desconhecido"
                }));
            }
        }
    } catch (err) {
        console.error("Exceção ao processar autores de séries:", err);
        seriesWithAuthorInfo = seriesData.map(serie => ({
            ...serie,
            authorName: "Autor desconhecido"
        }));
    }

    // SEÇÃO 5: Buscar capítulos - ISOLADA COMPLETAMENTE
    let chaptersData = [];
    let seriesInfo = {};
    
    // Isolar completamente a busca de capítulos para evitar falhas
    try {
        const seriesIds = seriesData?.map(serie => serie.id) || [];
        
        if (seriesIds.length > 0) {
            // Criar mapa de informações da série para cada capítulo
            seriesData.forEach(serie => {
                seriesInfo[serie.id] = {
                    title: serie.title,
                    id: serie.id
                };
            });
            
            try {
                // Dividir a busca dos capítulos em consultas menores para evitar problemas com IN
                const MAX_BATCH_SIZE = 10;
                let allChaptersFromSeries = [];
                
                // Processar em lotes para evitar consultas muito grandes
                for (let i = 0; i < seriesIds.length; i += MAX_BATCH_SIZE) {
                    const batchSeriesIds = seriesIds.slice(i, i + MAX_BATCH_SIZE);
                    
                    try {
                        // Buscar capítulos sem a junção de profiles
                        const { data: chaptersFromSeriesBatch, error: chaptersError } = await supabase
                            .from("chapters")
                            .select(`
                                id,
                                title,
                                content,
                                created_at,
                                series_id,
                                author_id
                            `)
                            .in("series_id", batchSeriesIds)
                            .order("created_at", { ascending: false });
                            
                        if (chaptersError) {
                            // Melhorar log para ver detalhes do erro e os IDs consultados
                            console.error(`Erro ao buscar lote de capítulos (${i} a ${i + MAX_BATCH_SIZE}):`, JSON.stringify(chaptersError, null, 2));
                            console.error(`IDs da série no lote com erro:`, batchSeriesIds);
                            // Considerar se deve parar ou continuar aqui.
                            // Por enquanto, mantém o comportamento de continuar.
                        } else if (chaptersFromSeriesBatch) {
                            allChaptersFromSeries.push(...chaptersFromSeriesBatch);
                        }
                    } catch (batchErr) {
                        console.error(`Exceção ao buscar lote de capítulos (${i} a ${i + MAX_BATCH_SIZE}):`, batchErr);
                        console.error(`IDs da série no lote com exceção:`, batchSeriesIds);
                        // Continuar para o próximo lote em caso de exceção no batch
                    }
                }
                
                if (allChaptersFromSeries.length > 0) {
                    // Obter IDs únicos de autores de capítulos
                    const authorIds = [...new Set(allChaptersFromSeries.map(chapter => chapter.author_id))].filter(Boolean);
                    
                    if (authorIds.length > 0) {
                        try {
                            // Buscar informações de autor
                            const { data: chapterAuthorsData, error: authorsError } = await supabase
                                .from("profiles")
                                .select("id, username")
                                .in("id", authorIds);
                                
                            if (authorsError) {
                                console.error("Erro ao buscar autores de capítulos:", authorsError);
                                // Usar informação padrão
                                chaptersData = allChaptersFromSeries.map(chapter => ({
                                    ...chapter,
                                    authorName: "Autor desconhecido"
                                }));
                            } else {
                                // Criar mapa de autor ID para username
                                const chapterAuthors = {};
                                chapterAuthorsData?.forEach(author => {
                                    chapterAuthors[author.id] = author.username;
                                });
                                
                                // Adicionar informações de autor aos capítulos
                                chaptersData = allChaptersFromSeries.map(chapter => ({
                                    ...chapter,
                                    authorName: chapterAuthors[chapter.author_id] || "Autor desconhecido"
                                }));
                            }
                        } catch (authErr) {
                            console.error("Exceção ao buscar autores de capítulos:", authErr);
                            // Usar informação padrão em caso de erro
                            chaptersData = allChaptersFromSeries.map(chapter => ({
                                ...chapter,
                                authorName: "Autor desconhecido"
                            }));
                        }
                    } else {
                        // Se não houver authorIds válidos
                        chaptersData = allChaptersFromSeries.map(chapter => ({
                            ...chapter,
                            authorName: "Autor desconhecido"
                        }));
                    }
                }
            } catch (err) {
                console.error("Exceção geral ao processar capítulos:", err);
            }
        }
    } catch (err) {
        console.error("Exceção crítica ao processar capítulos:", err);
    }

    // Função para criar um resumo do conteúdo
    const createSummary = (htmlContent, maxLength = 150) => {
        if (!htmlContent) return "";
        // Remover tags HTML
        const textContent = htmlContent.replace(/<[^>]*>/g, "");
        // Limitar o tamanho
        if (textContent.length <= maxLength) return textContent;
        // Cortar no final de uma palavra
        let summary = textContent.substring(0, maxLength);
        summary = summary.substring(0, summary.lastIndexOf(" "));
        return `${summary}...`;
    };

    // Combinar todos os resultados para exibição
    const allResults = [
        ...(storiesWithAuthorInfo || []).map(story => ({
            ...story,
            type: 'story',
            content: story.content,
            authorName: story.authorName
        })),
        ...(seriesWithAuthorInfo || []).map(serie => ({
            ...serie,
            type: 'series',
            content: serie.description,
            authorName: serie.authorName
        })),
        ...(chaptersData || []).map(chapter => ({
            ...chapter,
            type: 'chapter',
            content: chapter.content,
            authorName: chapter.authorName,
            seriesTitle: seriesInfo[chapter.series_id]?.title || "Série Desconhecida",
            seriesId: chapter.series_id
        }))
    ].filter(Boolean); // Remover itens undefined ou null

    // Ordenar por data de criação (mais recentes primeiro)
    allResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Paginar os resultados combinados
    const paginatedResults = allResults.slice(from, to + 1);
    const totalCount = allResults.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Se não encontrou nenhum resultado e não é devido a um erro, retorna 404
    if (allResults.length === 0 && !storiesError && !seriesError) {
        return (
            <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
                <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Histórias de {categoryName}</h1>

                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-lg text-gray-600 mb-4">Ainda não há histórias nesta categoria.</p>
                    <Link 
                        href="/dashboard/new" 
                        className="inline-block h-10 px-6 bg-[#484DB5] text-white font-medium rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out flex items-center justify-center"
                    >
                        Seja o primeiro a publicar
                    </Link>
                </div>

                <div className="mt-8 text-center">
                    <Link 
                        href="/categories" 
                        className="inline-block h-10 px-6 border border-[#E5E7EB] bg-white text-[#484DB5] font-medium rounded-md hover:shadow-md transition-all duration-300 ease-in-out flex items-center justify-center"
                    >
                        Ver todas as categorias
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Histórias de {categoryName}</h1>

            {allResults.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-lg text-gray-600 mb-4">Ainda não há histórias nesta categoria.</p>
                    <Link 
                        href="/dashboard/new" 
                        className="inline-block h-10 px-6 bg-[#484DB5] text-white font-medium rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out flex items-center justify-center"
                    >
                        Seja o primeiro a publicar
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginatedResults.map((item) => (
                            <Link
                                href={item.type === 'story' 
                                    ? `/story/${generateSlug(item.title, item.id)}`
                                    : item.type === 'series'
                                    ? `/series/${generateSlug(item.title, item.id)}`
                                    : `/chapter/${item.id}`
                                }
                                key={`${item.type}-${item.id}`}
                                className="block p-4 bg-white border border-[#E5E7EB] rounded-md shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 relative overflow-hidden group"
                            >
                                <div className="flex flex-col">
                                    {item.type === 'chapter' && (
                                        <div className="mb-1">
                                            <span className="text-sm font-medium text-[#484DB5]">
                                                Capítulo da série: {item.seriesTitle}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-[#484DB5] transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        
                                        <span className="text-xs font-medium text-white px-2 py-0.5 rounded-full bg-[#484DB5] bg-opacity-80">
                                            {item.type === 'story' ? 'Conto' : item.type === 'series' ? 'Série' : 'Capítulo'}
                                        </span>
                                    </div>
                                </div>
                                
                                {item.content && (
                                    <p className="text-gray-600 mb-3 line-clamp-2 mt-2">
                                        {createSummary(item.content)}
                                    </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-2 text-sm">
                                    <p className="text-[#484DB5] font-medium">
                                        por {item.authorName}
                                    </p>
                                    <p className="text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>
                                
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                baseUrl={`/categories/${params.category}`}
                            />
                        </div>
                    )}
                </>
            )}

            <div className="mt-8 text-center">
                <Link 
                    href="/categories" 
                    className="inline-block h-10 px-6 border border-[#E5E7EB] bg-white text-[#484DB5] font-medium rounded-md hover:shadow-md transition-all duration-300 ease-in-out flex items-center justify-center"
                >
                    Ver todas as categorias
                </Link>
            </div>
        </div>
    );
}
