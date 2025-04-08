// src/app/series/page.js
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Pagination from "@/components/Pagination";
import { generateSlug } from "@/lib/utils";

const PAGE_SIZE = 12; // Número de séries por página

export const metadata = {
    title: "Séries Literárias",
    description:
        "Explore séries de histórias em capítulos na Casa dos Escritores",
};

export default async function SeriesPage({ searchParams }) {
    try {
        console.log("Carregando página de séries");
        const supabase = await createServerSupabaseClient();
        const page = searchParams.page ? parseInt(searchParams.page) : 1;

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
            <div className="series-browse-page">
                <div className="series-header">
                    <h1>Séries Literárias</h1>
                    <p className="series-subtitle">
                        Explore histórias em capítulos criadas pelos escritores
                        da plataforma.
                    </p>
                </div>

                {series?.length === 0 ? (
                    <div className="empty-state">
                        <p>Ainda não há séries publicadas.</p>
                        <Link href="/dashboard/new" className="btn primary">
                            Crie a primeira série
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="series-grid">
                            {seriesWithChapterCount.map((serie) => (
                                <Link
                                    href={`/series/${generateSlug(serie.title, serie.id)}`}
                                    key={serie.id}
                                    className="series-card"
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
                                                {serie.title
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="series-card-content">
                                        <h3 className="series-title">
                                            {serie.title}
                                        </h3>
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
                                            <span className="series-status">
                                                {serie.is_completed
                                                    ? "Completa"
                                                    : "Em andamento"}
                                            </span>
                                        </div>
                                        {serie.genre && (
                                            <span className="series-genre">
                                                {serie.genre}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                baseUrl="/series"
                            />
                        )}
                    </>
                )}
            </div>
        );
    } catch (error) {
        console.error("Erro na página de séries:", error);
        return (
            <div className="series-browse-page">
                <div className="series-header">
                    <h1>Séries Literárias</h1>
                    <p className="series-subtitle">
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
