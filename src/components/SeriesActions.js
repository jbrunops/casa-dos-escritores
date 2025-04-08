"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Edit, Trash2, BookOpen } from "lucide-react";

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
        <div className="flex flex-wrap gap-2 mt-4">
            {series.first_chapter ? (
                <Link
                    href={`/chapter/${series.first_chapter}`}
                    className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200"
                >
                    <BookOpen size={18} className="mr-2" />
                    <span>Ver Série</span>
                </Link>
            ) : (
                <span className="inline-flex items-center justify-center h-10 px-4 border border-[#E5E7EB] text-gray-400 rounded-md bg-gray-50 cursor-not-allowed">
                    <BookOpen size={18} className="mr-2" />
                    <span>Sem Capítulos</span>
                </span>
            )}

            {isAuthor && (
                <>
                    <Link
                        href={`/dashboard/edit-series/${series.id}`}
                        className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200"
                    >
                        <Edit size={18} className="mr-2" />
                        <span>Editar Série</span>
                    </Link>

                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex items-center justify-center h-10 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={18} className="mr-2" />
                        <span>{deleting ? "Excluindo..." : "Excluir"}</span>
                    </button>
                </>
            )}

            {error && <div className="w-full mt-2 p-2 text-sm bg-red-50 text-red-600 rounded-md">{error}</div>}
        </div>
    );
}
