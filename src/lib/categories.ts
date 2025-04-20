import { createServerSupabaseClient } from "@/lib/supabase-server"; // Importar do .ts
import { SupabaseClient } from '@supabase/supabase-js'; // Importar tipo

// Interface para o objeto de categoria retornado
export interface CategoryData {
    name: string;
    slug: string;
    description: string;
    count: number;
}

// Tipar o objeto de descrições
const categoryDescriptions: { [key: string]: string } = {
    "Fantasia": "Mundos mágicos, criaturas fantásticas e aventuras extraordinárias.",
    "Romance": "Histórias de amor, relacionamentos e emoções intensas.",
    "Terror": "Narrativas assustadoras que exploram o medo e o desconhecido.",
    "LGBTQ+": "Histórias que celebram e exploram diversas identidades e experiências.",
    "Humor": "Contos divertidos e situações cômicas para animar seu dia.",
    "Poesia": "Expressões artísticas em versos que tocam a alma.",
    "Ficção Científica": "Visões do futuro, tecnologia avançada e exploração espacial.",
    "Brasileiro": "Histórias com o charme, cultura e identidade brasileira.",
    "Anime": "Narrativas inspiradas no estilo japonês de storytelling.",
    "Outros": "Gêneros diversos e histórias que desafiam classificações.",
};

// Tipar a lista de categorias padrão
const defaultCategories: string[] = [
    "Fantasia",
    "Romance",
    "Terror",
    "LGBTQ+",
    "Humor",
    "Poesia",
    "Ficção Científica",
    "Brasileiro",
    "Anime",
    "Outros",
];

// Função para gerar slugs amigáveis para URL
function generateSlug(name: string): string {
    if (!name) return '';
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, '');
}

/**
 * Busca todas as categorias únicas de histórias e séries publicadas,
 * conta o número de publicações em cada uma e retorna uma lista estruturada.
 * Inclui descrições e slugs. Usa categorias padrão se nenhuma for encontrada.
 * @returns {Promise<CategoryData[]>}
 */
export async function fetchAllCategoriesWithCounts(): Promise<CategoryData[]> {
    try {
        // A função createServerSupabaseClient já deve retornar um SupabaseClient tipado
        const supabase: SupabaseClient = createServerSupabaseClient(); // Tipar cliente

        // Buscar categorias únicas das histórias
        // Definir tipo esperado para os dados retornados
        const { data: storyCategoriesData, error: storyError } = await supabase
            .from("stories")
            .select("category")
            .eq("is_published", true)
            .not("category", "is", null);

        if (storyError) {
            console.error("Erro ao buscar categorias de histórias:", storyError);
            // Considerar lançar o erro ou retornar um array vazio
        }

        // Buscar categorias únicas das séries (campo genre)
        const { data: seriesCategoriesData, error: seriesError } = await supabase
            .from("series")
            .select("genre") // Assumindo que o campo é 'genre' para séries
            .not("genre", "is", null); // Adicionar filtro de publicação se necessário

        if (seriesError) {
            console.error("Erro ao buscar categorias de séries:", seriesError);
            // Considerar lançar o erro ou retornar um array vazio
        }

        // Extrair e combinar categorias únicas de histórias e séries com tipagem
        const storyCategList: string[] = storyCategoriesData?.map((item: { category: string }) => item.category) || [];
        const seriesCategList: string[] = seriesCategoriesData?.map((item: { genre: string }) => item.genre) || [];
        const allCategoriesRaw: string[] = [...storyCategList, ...seriesCategList];

        // Filtrar e ordenar categorias únicas
        const uniqueCategories: string[] = [...new Set(allCategoriesRaw)]
            .filter((category): category is string => Boolean(category)) // Type guard para remover null/undefined
            .sort();

        // Usar categorias encontradas ou as padrão
        const displayCategoryNames: string[] = uniqueCategories.length > 0 ? uniqueCategories : defaultCategories;

        // Contar publicações por categoria com tipagem
        const categoryCountMap: { [key: string]: number } = {};
        displayCategoryNames.forEach(category => {
            categoryCountMap[category] = 0; // Inicializa contadores
        });

        // Contar histórias
        storyCategList.forEach(category => {
            if (category && categoryCountMap.hasOwnProperty(category)) {
                categoryCountMap[category]++;
            }
        });

        // Contar séries
        seriesCategList.forEach(genre => {
            if (genre && categoryCountMap.hasOwnProperty(genre)) {
                categoryCountMap[genre]++;
            }
        });

        // Montar o resultado final estruturado com tipagem
        const categoriesData: CategoryData[] = displayCategoryNames.map(name => ({
            name: name,
            slug: generateSlug(name),
            description: categoryDescriptions[name] || `Explore publicações na categoria ${name}.`, // Fallback description
            count: categoryCountMap[name] || 0,
        }));

        return categoriesData;

    } catch (error) {
        console.error("Erro inesperado ao buscar e processar categorias:", error);
        return []; // Retorna array vazio em caso de erro inesperado
    }
} 