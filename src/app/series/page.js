// src/app/series/page.js
import Link from "next/link";
// import { createServerSupabaseClient } from "@/lib/supabase-server"; // REMOVIDO
import Pagination from "@/components/Pagination";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// NOVOS IMPORTS para criar cliente Supabase diretamente
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const PAGE_SIZE = 12; // Número de séries por página

export const metadata = {
    title: "Séries Literárias",
    description:
        "Explore séries de histórias em capítulos na Casa dos Escritores",
};

export default async function SeriesPage({ searchParams }) {
    try {
        console.log("Carregando página de séries");
        
        // <<< CRIAR CLIENTE SUPABASE DIRETAMENTE AQUI >>>
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) { return cookieStore.get(name)?.value; },
                    // set e remove não são necessários para leitura
                },
            }
        );
        
        const page = searchParams.page ? parseInt(searchParams.page) : 1;

        // Obter a sessão do usuário
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // Calcular o offset para paginação
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Buscar séries com paginação
        const {
            data: series,
            count,
            error,
        } = await supabase
            .from("series")
            .select(
                `
                id,
                title,
                genre,
                cover_url,
                is_completed,
                view_count,
                author_id
              `,
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Erro ao buscar séries:", error);
            throw error;
        }

        console.log("Séries encontradas:", series?.length || 0);

        // Buscar autores para cada série
        const seriesWithAuthors = await Promise.all(
            (series || []).map(async (serie) => {
                try {
                    const { data: author } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", serie.author_id)
                        .single();

                    return {
                        ...serie,
                        author_name: author?.username || "Autor desconhecido",
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

        // Buscar contagem de capítulos para cada série
        const seriesWithChapterCount = await Promise.all(
            seriesWithAuthors.map(async (serie) => {
                const { count: chapterCount, error: countError } =
                    await supabase
                        .from("chapters") // Mudado de stories para chapters
                        .select("*", { count: "exact" })
                        .eq("series_id", serie.id);

                if (countError) {
                    console.warn("Erro ao contar capítulos:", countError);
                    return {
                        ...serie,
                        chapter_count: 0,
                    };
                }

                return {
                    ...serie,
                    chapter_count: chapterCount || 0,
                };
            })
        );

        // Calcular o número total de páginas
        const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
                    <p className="text-gray-600">
                        Explore histórias em capítulos criadas pelos escritores
                        da plataforma.
                    </p>
                </div>

                {/* Botão condicional */}
                <div className="mb-6 text-center">
                    {user ? (
                        <Button asChild className="bg-primary hover:bg-primary-600 text-white">
                            <Link href="/write">Criar novo texto</Link>
                        </Button>
                    ) : (
                         <Button asChild variant="outline" className="border-border text-primary hover:bg-gray-100">
                             <Link href="/login">Comece a escrever agora mesmo</Link>
                         </Button>
                    )}
                </div>

                {series?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <p className="text-gray-600">Ainda não há séries publicadas.</p>
                        {/* Mantem o botão original caso não hajam séries, mas agora depende do login */} 
                        {user ? (
                            <Button asChild className="bg-primary hover:bg-primary-600 text-white">
                                <Link href="/write">Crie a primeira série</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline" className="border-border text-primary hover:bg-gray-100">
                                <Link href="/login">Comece a escrever agora mesmo</Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                            {seriesWithChapterCount.map((serie) => (
                                <Link
                                    href={`/obra/${generateSlug(serie.title, serie.id)}`}
                                    key={serie.id}
                                    className="flex flex-col rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="relative w-full pt-[150%]">
                                        {serie.cover_url ? (
                                            <img
                                                src={serie.cover_url}
                                                alt={serie.title}
                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-bold">
                                                {serie.title.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex-grow flex flex-col">
                                        <h3 className="font-bold text-base line-clamp-2 mb-1">{serie.title}</h3>
                                        <p className="text-xs text-gray-600 mb-2">
                                            de {serie.author_name}
                                        </p>
                                        {serie.genre && (
                                            <div className="mb-2">
                                                <span className="text-xs text-primary font-medium">
                                                    › {serie.genre}
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-auto flex items-center justify-between text-xs text-gray-600">
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                {serie.view_count?.toLocaleString("pt-BR") || "0"}
                                            </div>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {serie.chapter_count}
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${serie.is_completed ? 'bg-green-100 text-green-800' : 'text-primary bg-primary-100'}`}>
                                                {serie.is_completed ? "Completa" : "escrevendo..."}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-8">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    baseUrl="/series"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Botão para login em caso de erro */}
                <div className="mb-6 text-center">
                    <Button asChild variant="outline" className="border-border text-primary hover:bg-gray-100">
                        <Link href="/login">Faça login para tentar novamente</Link>
                    </Button>
                </div>

                <div className="error-message">
                    <p>
                        Não foi possível carregar as séries. Por favor, tente
                        novamente.
                    </p>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro na página de séries:", error);
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
                    <p className="text-gray-600">
                        Explore histórias em capítulos criadas pelos escritores
                        da plataforma.
                    </p>
                </div>
                <div className="error-message">
                    <p>
                        Não foi possível carregar as séries. Por favor, tente
                        novamente.
                    </p>
                </div>
            </div>
        );
    }
}
