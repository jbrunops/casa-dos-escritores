import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const metadata = {
    title: "Todas as Categorias",
    description: "Explore todas as categorias de histórias",
};

export default async function CategoriesPage() {
    const supabase = await createServerSupabaseClient();

    // Buscar categorias únicas das histórias
    const { data: storyCategories } = await supabase
        .from("stories")
        .select("category")
        .eq("is_published", true)
        .not("category", "is", null);

    // Buscar categorias únicas das séries (campo genre)
    const { data: seriesCategories } = await supabase
        .from("series")
        .select("genre")
        .not("genre", "is", null);

    // Extrair e combinar categorias únicas de histórias e séries
    const storyCategList = storyCategories?.map(item => item.category) || [];
    const seriesCategList = seriesCategories?.map(item => item.genre) || [];
    const allCategories = [...storyCategList, ...seriesCategList];
    
    const categories = [...new Set(allCategories)]
        .filter(Boolean)
        .sort();

    // Lista padrão de categorias se não houver histórias ainda
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

    // Descrições para cada categoria
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

    const displayCategories =
        categories.length > 0 ? categories : defaultCategories;

    // Contar publicações por categoria
    const categoryCountMap = {};
    
    // Inicializar contadores para todas as categorias
    displayCategories.forEach(category => {
        categoryCountMap[category] = 0;
    });
    
    // Contar histórias por categoria
    storyCategories?.forEach(item => {
        if (item.category && categoryCountMap.hasOwnProperty(item.category)) {
            categoryCountMap[item.category]++;
        }
    });
    
    // Contar séries por categoria (genre)
    seriesCategories?.forEach(item => {
        if (item.genre && categoryCountMap.hasOwnProperty(item.genre)) {
            categoryCountMap[item.genre]++;
        }
    });

    return (
        <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Todas as Categorias</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.875rem]">
                {displayCategories.map((category) => (
                    <Link
                        key={category}
                        href={`/categories/${category
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        className="flex flex-col h-auto py-4 px-5 bg-white border border-[#E5E7EB] rounded-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:border-gray-300 relative overflow-hidden group"
                    >
                        <div className="flex items-center justify-between mb-2 z-10">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-medium text-gray-900">{category}</h2>
                                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-[1.5rem] text-xs font-medium text-white bg-[#484DB5] rounded-full px-1.5">
                                    {categoryCountMap[category] || 0}
                                </span>
                            </div>
                            <span className="text-[#484DB5] transition-transform duration-300 transform group-hover:translate-x-1">→</span>
                        </div>
                        <p className="text-sm text-gray-600 z-10">
                            {categoryDescriptions[category] || `Explore histórias na categoria ${category}.`}
                        </p>
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
