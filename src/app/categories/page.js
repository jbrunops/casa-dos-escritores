import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const metadata = {
    title: "Todas as Categorias",
    description: "Explore todas as categorias de histórias",
};

export default async function CategoriesPage() {
    const supabase = await createServerSupabaseClient();

    // Buscar categorias únicas das histórias
    const { data } = await supabase
        .from("stories")
        .select("category")
        .eq("is_published", true)
        .not("category", "is", null);

    // Extrair categorias únicas
    const categories = [...new Set(data?.map((item) => item.category))]
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

    const displayCategories =
        categories.length > 0 ? categories : defaultCategories;

    return (
        <div className="max-w-[75rem] mx-auto px-4 py-[1.875rem]">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Todas as Categorias</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.875rem]">
                {displayCategories.map((category) => (
                    <Link
                        key={category}
                        href={`/categories/${category
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        className="flex items-center justify-between h-10 px-4 bg-white border border-[#E5E7EB] rounded-md hover:shadow-md transition-shadow duration-200"
                    >
                        <h2 className="text-lg font-medium text-gray-900">{category}</h2>
                        <span className="text-[#484DB5]">→</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
