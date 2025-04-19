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

    // Ação primária: Ler o primeiro capítulo ou a série
    const primaryAction = series.first_chapter ? (
        <Link
            href={`/ler/${series.first_chapter}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
            Ler Primeiro Capítulo
        </Link>
    ) : (
        <Link
             href={`/obra/${generateSlug(series.title, series.id)}`}
             className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
            Ver Obra
        </Link>
    );

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {primaryAction}

            {isAuthor && (
                <>
                    <Link
                        href={`/write/chapter/${series.id}`}
                        className="inline-flex items-center justify-center h-10 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-300 ease-in-out"
                    >
                        <BookOpen size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">Adicionar Capítulo</span>
                    </Link>

                    <Link
                        href={`/edit/series/${series.id}`}
                        className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out"
                    >
                        <Edit size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">Editar Série</span>
                    </Link>

                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex items-center justify-center h-10 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">{deleting ? "Excluindo..." : "Excluir"}</span>
                    </button>
                </>
            )}

            {error && <div className="w-full mt-2 p-2 text-sm bg-red-50 text-red-600 rounded-md">{error}</div>}
        </div>
    );
}
