import { createServerSupabaseClient } from "@/lib/supabase-server"; // USO CORRETO: este arquivo é server-side.
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import { ArrowLeft, Search } from "lucide-react";

export const metadata = {
    title: "Resultados de pesquisa",
    description: "Pesquise histórias em nossa plataforma",
};

interface SearchPageProps {
    searchParams: { q?: string; page?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || "";
    if (!query || query.length < 3) {
        return (
            <div className="mx-auto max-w-[75rem] w-full px-4 md:px-0 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Pesquisa</h1>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center mb-6">
                    <Search size={40} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-6">
                        {query.length < 3
                            ? "Por favor, digite pelo menos 3 caracteres para pesquisar."
                            : "Por favor, insira um termo de pesquisa."}
                    </p>
                    <Link href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-[#484DB5] text-white font-medium hover:bg-opacity-90 transition-all duration-200">
                        Voltar para o início
                    </Link>
                </div>
            </div>
        );
    }
    const PAGE_SIZE = 20;
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const supabase = await createServerSupabaseClient();
    // Buscar histórias
    const { data: stories, error } = await supabase
        .from("stories")
        .select(`id, title, content, created_at, category, profiles(username)`)
        .eq("is_published", true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .range(from, to);
    if (error) notFound();
    return (
        <div className="search-page">
            <h1 className="text-2xl font-bold mb-4">Resultados da Pesquisa</h1>
            <div className="grid gap-4">
                {(stories || []).length === 0 ? (
                    <div className="text-gray-500">Nenhum resultado encontrado.</div>
                ) : (
                    stories?.map((story) => (
                        <div key={story.id} className="border rounded-lg p-4 bg-white">
                            <h2 className="text-lg font-semibold mb-1">
                                <Link href={`/story/${generateSlug(story.title, story.id)}`}>{story.title}</Link>
                            </h2>
                            <div className="text-sm text-gray-500">
                                {story.profiles?.username || "Autor desconhecido"}
                            </div>
                            <div className="text-xs text-gray-400">
                                {story.category}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
