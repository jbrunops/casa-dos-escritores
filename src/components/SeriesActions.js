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
        <div className="series-detail-actions">
            {series.first_chapter ? (
                <Link
                    href={`/chapter/${series.first_chapter}`}
                    className="series-action-btn series-action-secondary"
                >
                    <BookOpen size={18} />
                    <span>Ver Série</span>
                </Link>
            ) : (
                <span className="series-action-btn series-action-secondary disabled">
                    <BookOpen size={18} />
                    <span>Sem Capítulos</span>
                </span>
            )}

            {isAuthor && (
                <>
                    <Link
                        href={`/dashboard/new-chapter/${series.id}`}
                        className="series-action-btn series-action-primary"
                    >
                        <Plus size={18} />
                        <span>Adicionar Capítulo</span>
                    </Link>

                    <Link
                        href={`/dashboard/edit-series/${series.id}`}
                        className="series-action-btn series-action-secondary"
                    >
                        <Edit size={18} />
                        <span>Editar Série</span>
                    </Link>

                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="series-action-btn series-action-danger"
                    >
                        <Trash2 size={18} />
                        <span>{deleting ? "Excluindo..." : "Excluir"}</span>
                    </button>
                </>
            )}

            {error && <div className="error-message">{error}</div>}
        </div>
    );
}
