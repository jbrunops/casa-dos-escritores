"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, BookOpen, Bookmark } from "lucide-react";
import { formatDate, calculateReadingTime, generateSlug } from "@/lib/utils";

export default function ContentHeader({
  title,
  subtitle,
  author,
  seriesId,
  publishDate,
  contentType,
  category,
  viewCount,
  readingTime,
  content,
  seriesTitle,
  chapterNumber,
  isBookmarked,
  onBookmark,
}) {
  // Calcular tempo de leitura se não for fornecido
  const [calculatedReadingTime, setCalculatedReadingTime] = useState(
    readingTime || (content ? calculateReadingTime(content) : 5)
  );

  // Formatar data
  const formattedDate = formatDate(publishDate);

  // Gerenciar estado de marcador
  const [bookmarked, setBookmarked] = useState(isBookmarked || false);

  useEffect(() => {
    setBookmarked(isBookmarked || false);
  }, [isBookmarked]);

  // Funções para lidar com eventos
  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if (onBookmark) onBookmark(!bookmarked);
  };

  return (
    <div className="mb-8 font-poppins">
      {/* Título */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 leading-tight">
        {contentType === "chapter" && chapterNumber && (
          <span className="block text-lg text-gray-500 mb-1">
            Capítulo {chapterNumber}
          </span>
        )}
        {title}
      </h1>

      {/* Subtítulo ou série */}
      {subtitle && (
        <p className="text-xl text-gray-700 mb-4 font-serif italic">{subtitle}</p>
      )}
      
      {seriesTitle && contentType === "chapter" && (
        <div className="mb-4 text-base">
          <span className="text-gray-600">Da série </span>
          <Link 
            href={seriesId ? `/series/${generateSlug(seriesTitle, seriesId)}` : '#'}
            className="text-[#484DB5] hover:underline transition-colors duration-200"
          >
            {seriesTitle}
          </Link>
        </div>
      )}

      {/* Informações do autor e metadados */}
      <div className="flex items-center justify-between flex-wrap gap-4 mt-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Avatar do autor */}
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.username || "Autor"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center font-medium">
              {(author?.username || "A").charAt(0).toUpperCase()}
            </div>
          )}

          {/* Nome do autor e metadados */}
          <div>
            <Link
              href={`/profile/${encodeURIComponent(author?.username || "")}`}
              className="font-medium text-gray-900 hover:underline transition-all duration-300"
            >
              {author?.username || "Autor desconhecido"}
            </Link>
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-1">
              <span>{formattedDate}</span>
              <span className="mx-1">·</span>
              <span className="flex items-center gap-1">
                <BookOpen size={14} />
                {calculatedReadingTime} min para ler
              </span>
              {viewCount !== undefined && (
                <>
                  <span className="mx-1">·</span>
                  <span className="flex items-center gap-1" title="Visualizações">
                    <Eye size={14} />
                    {typeof viewCount === "number"
                      ? viewCount.toLocaleString("pt-BR")
                      : viewCount}
                  </span>
                </>
              )}
              {category && (
                <>
                  <span className="mx-1">·</span>
                  <Link
                    href={`/categories/${category
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                    className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors duration-300"
                  >
                    {category}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botão de favorito/bookmark */}
        <button
          onClick={handleBookmark}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#484DB5] transition-colors duration-200"
        >
          <Bookmark
            size={16}
            className={bookmarked ? "fill-[#484DB5] text-[#484DB5]" : ""}
          />
          <span>{bookmarked ? "Salvo" : "Salvar"}</span>
        </button>
      </div>
    </div>
  );
} 