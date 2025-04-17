"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Edit, Trash2, BookOpen } from "lucide-react";

interface Series {
  id: string;
  title: string;
}

interface SeriesActionsProps {
  series: Series;
  isAuthor: boolean;
}

export default function SeriesActions({ series, isAuthor }: SeriesActionsProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a série "${series.title}"? Todos os capítulos também serão excluídos.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const { error: chaptersError } = await supabase
        .from("chapters")
        .delete()
        .eq("series_id", series.id);
      if (chaptersError) {
        setError("Erro ao excluir capítulos: " + chaptersError.message);
      }
      const { error: seriesError } = await supabase
        .from("series")
        .delete()
        .eq("id", series.id);
      if (seriesError) throw seriesError;
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError("Não foi possível excluir a série. Por favor, tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Link href={`/series/${series.id}/edit`} className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
        <Edit size={16} className="mr-1" /> Editar
      </Link>
      {isAuthor && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center px-3 py-1 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-60"
        >
          <Trash2 size={16} className="mr-1" /> Excluir
        </button>
      )}
      <Link href={`/series/${series.id}`} className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
        <BookOpen size={16} className="mr-1" /> Visualizar
      </Link>
      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
    </div>
  );
}
