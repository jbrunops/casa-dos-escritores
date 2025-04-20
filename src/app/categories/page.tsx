import Link from "next/link";
import { fetchAllCategoriesWithCounts, CategoryData } from "@/lib/categories";
import { Metadata } from "next"; // Importar Metadata type

export const metadata: Metadata = {
    title: "Todas as Categorias - Casa dos Escritores", // Título mais específico
    description: "Explore todas as categorias de histórias e descubra novas leituras na Casa dos Escritores.",
};

export default async function CategoriesPage() {
    let categoriesData: CategoryData[] = [];
    let fetchError: string | null = null;

    try {
        // Chamar a função para buscar os dados das categorias
        categoriesData = await fetchAllCategoriesWithCounts();
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        fetchError = "Não foi possível carregar as categorias no momento. Tente novamente mais tarde.";
    }

    return (
        <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Todas as Categorias</h1>

            {fetchError ? (
                <p className="text-red-600 bg-red-50 p-4 rounded-md">{fetchError}</p>
            ) : categoriesData.length === 0 ? (
                 <p className="text-gray-600 bg-gray-50 p-4 rounded-md">Nenhuma categoria encontrada.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.875rem]">
                    {categoriesData.map((category) => (
                        <Link
                            key={category.slug}
                            href={`/categories/${category.slug}`}
                            className={`block p-6 bg-white rounded-lg shadow-sm border border-border transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:border-[#484DB5] relative overflow-hidden group`}
                            aria-label={`Ver histórias da categoria ${category.name}`}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-medium text-gray-900">{category.name}</h2>
                                        <span
                                            className="inline-flex items-center justify-center min-w-[1.5rem] h-[1.5rem] text-xs font-medium text-white bg-[#484DB5] rounded-full px-1.5"
                                            aria-label={`${category.count} histórias`}
                                        >
                                            {category.count}
                                        </span>
                                    </div>
                                    <span className="text-[#484DB5] transition-transform duration-300 transform group-hover:translate-x-1" aria-hidden="true">→</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {category.description || `Explore histórias na categoria ${category.name}.`}
                                </p>
                            </div>
                            {/* Subtle background effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
} 