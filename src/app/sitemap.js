import { createServerSupabaseClient } from "@/lib/supabase-server";
import { fetchAllCategoriesWithCounts } from "@/lib/categories";

const URL_BASE = "https://casadosescritores.com";

export default async function sitemap() {
    const supabase = await createServerSupabaseClient();
    const lastModified = new Date().toISOString();

    // Buscar todas as séries publicadas (apenas IDs)
    const { data: series, error: seriesError } = await supabase
        .from("series")
        .select("id, updated_at") // Selecionar id e updated_at se disponível
        // Adicionar filtro .eq("is_published", true) se existir um campo de publicação
        ;

    if (seriesError) {
        console.error("Sitemap: Erro ao buscar séries:", seriesError);
        // Lidar com o erro, talvez retornar sitemap estático básico?
    }

    const seriesUrls = series?.map((serie) => ({
        url: `${URL_BASE}/series/${serie.id}`,
        // Usar serie.updated_at se disponível, senão a data atual
        lastModified: serie.updated_at ? new Date(serie.updated_at).toISOString() : lastModified, 
        changeFrequency: "weekly",
        priority: 0.7,
    })) || [];

    // Buscar todas as categorias
    const categories = await fetchAllCategoriesWithCounts();
    const categoryUrls = categories.map((category) => ({
        url: `${URL_BASE}/categories/${category.slug}`,
        lastModified: lastModified, // Categorias mudam menos, talvez 'monthly'? Mas lastModified pode ser a data atual
        changeFrequency: "monthly",
        priority: 0.6,
    }));

    // Páginas estáticas
    const staticUrls = [
        {
            url: URL_BASE,
            lastModified: lastModified,
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${URL_BASE}/series`,
            lastModified: lastModified,
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${URL_BASE}/categories`,
            lastModified: lastModified,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${URL_BASE}/search`,
            lastModified: lastModified,
            changeFrequency: "weekly",
            priority: 0.5,
        },
        // Adicionar outras páginas estáticas importantes aqui
    ];

    return [
        ...staticUrls,
        ...seriesUrls,
        ...categoryUrls,
    ];
}

// Adicionar revalidate para Next.js App Router (opcional, mas recomendado)
// Isso define com que frequência o sitemap deve ser regenerado (em segundos)
// export const revalidate = 86400; // Regenerar uma vez por dia (24 * 60 * 60) 