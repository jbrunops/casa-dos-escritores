"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Edit, Trash2, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import * as React from "react";
import { SupabaseClient } from "@supabase/supabase-js";

// Interface para a prop series
interface Series {
    id: string | number;
    title: string;
    first_chapter?: string | null; // ID do primeiro capítulo
}

// Props do componente
interface SeriesActionsProps {
    series: Series;
    isAuthor: boolean;
}

export default function SeriesActions({ series, isAuthor }: SeriesActionsProps) {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase: SupabaseClient = createBrowserClient();

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        setError(null);
        try {
            console.log("Excluindo capítulos da série", series.id);
            const { error: chaptersError } = await supabase
                .from("chapters")
                .delete()
                .eq("series_id", series.id);

            if (chaptersError) {
                // Logar, mas continuar para tentar excluir a série
                console.error("Erro ao excluir capítulos (tentando continuar):", chaptersError);
            }

            console.log("Excluindo a série", series.id);
            const { error: seriesError } = await supabase
                .from("series")
                .delete()
                .eq("id", series.id);

            if (seriesError) throw seriesError;

            console.log("Série excluída com sucesso");
            router.push("/dashboard");
            router.refresh();
            setIsConfirmModalOpen(false);
        } catch (err: any) {
            console.error("Erro completo ao excluir série:", err);
            setError("Não foi possível excluir a série. Verifique o console ou tente novamente.");
            setIsConfirmModalOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    // Ação primária: Ler primeiro capítulo ou Ver obra
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
        <div className="flex flex-wrap gap-2 mt-4 items-center">
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
                    
                    <ConfirmDeleteModal
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={handleDeleteConfirm}
                        title={`Excluir Série: "${series.title}"?`}
                        message="Todos os capítulos associados também serão excluídos permanentemente. Esta ação não pode ser desfeita."
                        confirmText={deleting ? "Excluindo..." : "Sim, Excluir Série"}
                        isDeleting={deleting}
                    />

                    <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        disabled={deleting}
                        className="inline-flex items-center justify-center h-10 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? <Loader2 size={18} className="sm:mr-2 animate-spin" /> : <Trash2 size={18} className="sm:mr-2" /> }
                        <span className="hidden sm:inline">{deleting ? "Excluindo..." : "Excluir Série"}</span>
                    </button>
                   
                </>
            )}

            {error && (
                <div className="w-full mt-2 p-2 text-sm bg-red-50 text-red-600 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
} 