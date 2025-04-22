"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ListOrdered } from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function ContentNavigation({
  prevChapter,
  nextChapter,
  seriesId,
  seriesTitle,
  currentChapterNumber,
  isCompact = false,
  showTopBorder = false,
  showBottomBorder = false,
}) {
  // Se não tivermos informações da série, não renderizar navegação
  if (!seriesId && !seriesTitle) {
    return null;
  }

  // Gerar link para a série principal
  const seriesLink = seriesId && seriesTitle 
    ? `/series/${generateSlug(seriesTitle, seriesId)}`
    : "#";

  // Construir classes de borda condicionalmente
  const borderClasses = [
    showTopBorder ? "border-t" : "",
    showBottomBorder ? "border-b" : "",
    (showTopBorder || showBottomBorder) ? "border-gray-200" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={`w-full ${isCompact ? 'py-2' : 'py-4'} ${borderClasses} my-6`}>
      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
        {/* Link para capítulo anterior */}
        <div className="flex-1 min-w-[120px] flex justify-start">
          {prevChapter ? (
            <Link
              href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
              className={`
                inline-flex items-center ${isCompact ? 'text-sm' : 'text-base'} text-gray-700 
                hover:text-[#484DB5] group transition-colors duration-200
              `}
              title={`Capítulo ${prevChapter.chapter_number}: ${prevChapter.title}`}
            >
              <ArrowLeft size={isCompact ? 16 : 18} className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Anterior</span>
                <span className="truncate max-w-[180px]">
                  Cap. {prevChapter.chapter_number}: {isCompact ? '' : prevChapter.title}
                </span>
              </div>
            </Link>
          ) : (
            <span className={`inline-flex items-center ${isCompact ? 'text-sm' : 'text-base'} text-gray-400`}>
              <ArrowLeft size={isCompact ? 16 : 18} className="mr-2 opacity-50" />
              <span>Primeiro capítulo</span>
            </span>
          )}
        </div>

        {/* Link para índice de capítulos (agora no centro) */}
        <div className="flex-shrink-0">
          <Link
            href={seriesLink}
            className={`
              inline-flex items-center ${isCompact ? 'text-sm px-3 h-8' : 'text-base px-4 h-10'} 
              border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 
              hover:text-[#484DB5] hover:border-[#484DB5] transition-all duration-300 hover:-translate-y-1
            `}
            title="Ver todos os capítulos"
          >
            <ListOrdered size={isCompact ? 14 : 16} className="mr-1" />
            <span>Índice</span>
          </Link>
        </div>

        {/* Link para próximo capítulo */}
        <div className="flex-1 min-w-[120px] flex justify-end">
          {nextChapter ? (
            <Link
              href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
              className={`
                inline-flex items-center justify-end ${isCompact ? 'text-sm' : 'text-base'} text-gray-700 
                hover:text-[#484DB5] group transition-colors duration-200
              `}
              title={`Capítulo ${nextChapter.chapter_number}: ${nextChapter.title}`}
            >
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500">Próximo</span>
                <span className="truncate max-w-[180px]">
                  Cap. {nextChapter.chapter_number}: {isCompact ? '' : nextChapter.title}
                </span>
              </div>
              <ArrowRight size={isCompact ? 16 : 18} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          ) : (
            <span className={`inline-flex items-center justify-end ${isCompact ? 'text-sm' : 'text-base'} text-gray-400`}>
              <span>Último capítulo</span>
              <ArrowRight size={isCompact ? 16 : 18} className="ml-2 opacity-50" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 