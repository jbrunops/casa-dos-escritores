import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SeriesCard from "./SeriesCard";

// Props adicionadas: title, orderByField, orderByAscending, limit
export default async function RankedSeriesList({ 
    title, 
    orderByField = "view_count", // Campo padrão para ordenação
    orderByAscending = false,   // Ordem padrão (descendente)
    limit = 8                   // Limite padrão
}) {
    const supabase = await createServerSupabaseClient();
    let seriesWithDetails = [];

    try {
        console.log(`[Server] Buscando séries para a seção "${title}" ordenadas por ${orderByField}`);
        
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
                author_name,
                created_at 
              ` // Adicionado created_at para o caso de ser necessário
              // Se 'created_at' não existir na view, a query pode falhar ou retornar null para ele.
              // A ordenação por 'id' desc será usada como fallback se orderByField for 'created_at' e ele não funcionar.
            )
            // Usar o campo e a ordem das props diretamente
            .order(orderByField, { ascending: orderByAscending })
            // Usar o limite da prop
            .limit(limit);

        if (seriesError) {
            console.error(`[Server] Erro na consulta das séries ("${title}"):`, seriesError);
            return null;
        }

        if (!initialSeries || initialSeries.length === 0) {
            console.log(`[Server] Nenhuma série encontrada para "${title}"`);
            return null;
        }

        console.log(`[Server] Séries encontradas ("${title}"):`, initialSeries.length);

        const seriesIds = initialSeries.map(s => s.id);

        const { data: chapterCounts, error: countError } = await supabase
            .from('chapters')
            .select('series_id, id', { count: 'exact', head: false })
            .in('series_id', seriesIds);

        if (countError) {
            console.warn(`[Server] Erro ao contar capítulos em lote ("${title}"):`, countError);
        }

        const countsMap = chapterCounts?.reduce((acc, { series_id }) => {
            acc[series_id] = (acc[series_id] || 0) + 1;
            return acc;
        }, {}) || {};

        seriesWithDetails = initialSeries.map(serie => ({
            ...serie,
            chapter_count: countsMap[serie.id] || 0,
        }));

    } catch (error) {
        console.error(`[Server] Erro geral ao buscar séries ("${title}"):`, error);
        return null;
    }

    if (seriesWithDetails.length === 0) {
        return null; 
    }

    // Determinar o link "Ver Todos" com base no título ou adicionar uma prop para isso?
    // Por enquanto, um link genérico para /series. Pode precisar de ajuste.
    const viewAllLink = "/series"; 

    // Determinar o número de colunas com base no limite? Ou manter fixo?
    // Manter 8 colunas por enquanto, como definido anteriormente. 
    // Talvez ajustar dinamicamente com base no 'limit' seja melhor no futuro.
    const gridColsClass = "lg:grid-cols-8"; // Mantendo 8 colunas por enquanto
    const gapClass = "lg:gap-2";

    return (
        <section className="pb-6 border-b border-[#D7D7D7]">
            <div className="max-w-[75rem] mx-auto px-4 md:px-0">
                <div className="flex items-center mb-6">
                    {/* Usar o título da prop */}
                    <h2 className="text-2xl font-extrabold text-black relative">
                        {title} 
                        <span className="block h-1 w-48 mt-2 bg-gradient-to-r from-[#484DB5] to-[#484DB5]/20 rounded-full"></span> {/* Estilo do span mantido, mas pode ser customizado se necessário */}
                    </h2>
                    <Link href={viewAllLink} className="flex items-center text-[#484DB5] hover:underline ml-4">
                        <span>Ver Todas</span>
                        <ChevronRight size={16} className="ml-1" />
                    </Link>
                </div>

                {/* Usar classes de grid definidas */}
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridColsClass} gap-3 ${gapClass}`}>
                    {seriesWithDetails.map((serie, index) => (
                        <SeriesCard 
                            key={serie.id}
                            serie={serie}
                            index={index}
                            // Mostrar ranking apenas para a seção de destaque? Ou adicionar prop?
                            showRanking={orderByField === 'view_count'} // Só mostra ranking se for ordenado por views
                        />
                    ))}
                </div>
            </div>
        </section>
    );
} 