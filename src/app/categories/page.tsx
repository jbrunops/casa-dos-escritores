import Link from "next/link";
import { fetchAllCategoriesWithCounts } from "@/lib/categories";

export const metadata = {
  title: "Todas as Categorias",
  description: "Explore todas as categorias de histórias",
};

interface Category {
  slug: string;
  name: string;
  count: number;
  description: string;
}

export default async function CategoriesPage() {
  const categoriesData = await fetchAllCategoriesWithCounts();
  return (
    <div className="max-w-[75rem] mx-auto w-full py-[1.875rem] px-4 md:px-0">
      <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Todas as Categorias</h1>
      {categoriesData.length === 0 ? (
        <p className="text-gray-600">Não foi possível carregar as categorias no momento. Tente novamente mais tarde.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.875rem]">
          {categoriesData.map((category: Category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="flex flex-col h-auto py-4 px-5 bg-white border border-[#E5E7EB] rounded-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:border-gray-300 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2 z-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">{category.name}</h2>
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-[1.5rem] text-xs font-medium text-white bg-[#484DB5] rounded-full px-1.5">
                    {category.count}
                  </span>
                </div>
                <span className="text-[#484DB5] transition-transform duration-300 transform group-hover:translate-x-1">→</span>
              </div>
              <p className="text-sm text-gray-600 z-10">{category.description}</p>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
