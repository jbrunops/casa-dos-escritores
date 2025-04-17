// src/components/SeriesHighlights.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Book, ChevronRight } from "lucide-react";
import { generateSlug } from "@/lib/utils";

interface Serie {
  id: string;
  title: string;
  cover_url?: string;
  genre?: string;
  view_count: number;
  is_completed: boolean;
  author_id: string;
  author_name: string;
  chapter_count: number;
}

export default function SeriesHighlights() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchPopularSeries() {
      try {
        setLoading(true);
        // Buscar as 5 séries mais visualizadas
        const { data, error } = await supabase
          .from("series")
          .select(`
            id,
            title,
            cover_url,
            genre,
            view_count,
            is_completed,
            author_id
          `)
          .limit(5);

        if (error) {
          setSeries([]);
          return;
        }
        if (!data || data.length === 0) {
          setSeries([]);
          return;
        }
        // Buscar autores para cada série
        const seriesWithAuthors = await Promise.all(
          data.map(async (serie: any) => {
            try {
              const { data: author } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", serie.author_id)
                .single();
              return {
                ...serie,
                author_name: author?.username || "Autor desconhecido",
              };
            } catch (err) {
              return {
                ...serie,
                author_name: "Autor desconhecido",
              };
            }
          })
        );
        // Para cada série, buscar contagem de capítulos
        const seriesWithChapters = await Promise.all(
          seriesWithAuthors.map(async (serie: any) => {
            try {
              const { count, error: countError } = await supabase
                .from("chapters")
                .select("*", { count: "exact" })
                .eq("series_id", serie.id);
              if (countError) {
                return {
                  ...serie,
                  chapter_count: 0,
                };
              }
              return {
                ...serie,
                chapter_count: count || 0,
              };
            } catch (err) {
              return {
                ...serie,
                chapter_count: 0,
              };
            }
          })
        );
        setSeries(seriesWithChapters);
      } catch {
        setSeries([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPopularSeries();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Carregando séries populares...</p>
      </div>
    );
  }
  if (series.length === 0) {
    return null;
  }
  return (
    <section className="py-8">
      <div className="max-w-[75rem] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-black relative">
            Séries em Destaque
            <span className="block h-1 w-64 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
          </h2>
          <Link href="/series" className="flex items-center text-[#484DB5] hover:underline">
            <span>Ver Todas</span>
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {series.map((serie, index) => (
            <Link
              href={`/series/${generateSlug(serie.title, serie.id)}`}
              key={serie.id}
              className="flex flex-col rounded-lg border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="relative w-full pt-[150%]">
                {index === 0 ? (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-sm font-bold rounded z-10">
                    #1
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 bg-[#484DB5] text-white px-2 py-1 text-sm font-bold rounded z-10">
                    #{index + 1}
                  </div>
                )}
                {serie.cover_url ? (
                  <img
                    src={serie.cover_url}
                    alt={serie.title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#484DB5] text-white text-4xl font-bold">
                    {serie.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="p-3 flex-grow flex flex-col">
                <h3 className="font-bold text-base line-clamp-2 mb-1">{serie.title}</h3>
                <p className="text-xs text-gray-600 mb-2">de {serie.author_name}</p>
                {serie.genre && (
                  <div className="mb-2">
                    <span className="text-xs text-[#484DB5] font-medium">› {serie.genre}</span>
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {serie.view_count.toLocaleString("pt-BR")}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {serie.chapter_count}
                  </div>
                  <span className="text-xs text-[#484DB5] bg-purple-100 px-2 py-0.5 rounded">
                    {serie.is_completed ? "Completa" : "escrevendo..."}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
