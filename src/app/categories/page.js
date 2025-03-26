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
        "Outros",
    ];

    const displayCategories =
        categories.length > 0 ? categories : defaultCategories;

    return (
        <div className="categories-page">
            <h1>Todas as Categorias</h1>

            <div className="categories-grid">
                {displayCategories.map((category) => (
                    <Link
                        key={category}
                        href={`/categories/${category
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        className="category-card"
                    >
                        <h2>{category}</h2>
                        <span className="category-arrow">→</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
