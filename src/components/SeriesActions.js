"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Edit, Trash2, BookOpen, Plus } from "lucide-react";

export default function SeriesActions({ series, isAuthor }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleDelete = async () => {
        if (
            !confirm(
                `Tem certeza que deseja excluir a série "${series.title}"? Todos os capítulos também serão excluídos.`
            )
        ) {
            return;
        }

        setDeleting(true);
        setError(null);

        try {
            console.log("Excluindo capítulos da série", series.id);
            // Excluir todos os capítulos associados primeiro
            const { error: chaptersError } = await supabase
                .from("chapters")
                .delete()
                .eq("series_id", series.id);

            if (chaptersError) {
                console.error("Erro ao excluir capítulos:", chaptersError);
                // Continuar tentando excluir a série
            }

            console.log("Excluindo a série", series.id);
            // Excluir a série
            const { error: seriesError } = await supabase
                .from("series")
                .delete()
                .eq("id", series.id);

            if (seriesError) throw seriesError;

            console.log("Série excluída com sucesso");
            // Redirecionar para o dashboard após sucesso
            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            console.error("Erro ao excluir série:", err);
            setError(
                "Não foi possível excluir a série. Por favor, tente novamente."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3 mt-6">
            {series.first_chapter ? (
                <Link
                    href={`/chapter/${series.first_chapter}`}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors"
                >
                    <BookOpen size={18} className="mr-2" />
                    <span className="font-medium">Ver Série</span>
                </Link>
            ) : (
                <span className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed">
                    <BookOpen size={18} className="mr-2" />
                    <span className="font-medium">Sem Capítulos</span>
                </span>
            )}

            {isAuthor && (
                <>
                    <Link
                        href={`/dashboard/new-chapter/${series.id}`}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                        <Plus size={18} className="mr-2" />
                        <span className="font-medium">Adicionar Capítulo</span>
                    </Link>

                    <Link
                        href={`/dashboard/edit-series/${series.id}`}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors"
                    >
                        <Edit size={18} className="mr-2" />
                        <span className="font-medium">Editar Série</span>
                    </Link>

                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${
                            deleting 
                            ? "bg-red-200 text-red-800 cursor-not-allowed" 
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                    >
                        <Trash2 size={18} className="mr-2" />
                        <span className="font-medium">{deleting ? "Excluindo..." : "Excluir"}</span>
                    </button>
                </>
            )}

            {error && <div className="w-full mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        </div>
    );
}
