import { createServerSupabaseClient } from "@/lib/supabase-server";

// Descrições padrão para cada categoria (pode ser movido para o DB no futuro)
const categoryDescriptions = {
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

// Lista padrão de categorias se não houver histórias/séries ainda
const defaultCategories = [
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
function generateSlug(name) {
    return name.toLowerCase().replace(/\\s+/g, "-").replace(/[^\w-]+/g, '');
}

/**
 * Busca todas as categorias únicas de histórias e séries publicadas,
 * conta o número de publicações em cada uma e retorna uma lista estruturada.
 * Inclui descrições e slugs. Usa categorias padrão se nenhuma for encontrada.
 * @returns {Promise<Array<{name: string, slug: string, description: string, count: number}>>}
 */
export async function fetchAllCategoriesWithCounts() {
    try {
        const supabase = await createServerSupabaseClient();

        // Buscar categorias únicas das histórias
        const { data: storyCategoriesData, error: storyError } = await supabase
            .from("stories")
            .select("category")
            .eq("is_published", true)
            .not("category", "is", null);

        if (storyError) {
            console.error("Erro ao buscar categorias de histórias:", storyError);
            // Poderia lançar o erro ou retornar vazio, dependendo da estratégia
        }

        // Buscar categorias únicas das séries (campo genre)
        const { data: seriesCategoriesData, error: seriesError } = await supabase
            .from("series")
            .select("genre") // Assumindo que o campo é 'genre' para séries
            .not("genre", "is", null); // Adicionando filtro de publicação se necessário

        if (seriesError) {
            console.error("Erro ao buscar categorias de séries:", seriesError);
             // Poderia lançar o erro ou retornar vazio
        }

        // Extrair e combinar categorias únicas de histórias e séries
        const storyCategList = storyCategoriesData?.map(item => item.category) || [];
        const seriesCategList = seriesCategoriesData?.map(item => item.genre) || [];
        const allCategoriesRaw = [...storyCategList, ...seriesCategList];

        const uniqueCategories = [...new Set(allCategoriesRaw)]
            .filter(Boolean) // Remove nulos ou vazios
            .sort();

        // Usar categorias encontradas ou as padrão
        const displayCategoryNames = uniqueCategories.length > 0 ? uniqueCategories : defaultCategories;

        // Contar publicações por categoria
        const categoryCountMap = {};
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

        // Montar o resultado final estruturado
        const categoriesData = displayCategoryNames.map(name => ({
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