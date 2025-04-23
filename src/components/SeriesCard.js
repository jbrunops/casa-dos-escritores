import Link from "next/link";
import Image from "next/image";

export default function SeriesCard({ serie, index, showRanking = false }) {
  return (
    <Link
      href={`/series/${serie.id}`}
      className="flex flex-col rounded-lg border border-[#D7D7D7] overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="relative w-full pt-[150%]">
        {showRanking && (
          <div className={`absolute top-2 left-2 bg-[#484DB5] text-white px-2 py-1 text-xs font-bold rounded z-10`}>
            #{index + 1}
          </div>
        )}
        
        {/* Status badge posicionado no canto direito superior */}
        <div className="absolute top-2 right-2 z-10">
          <span className="text-xs px-2 py-1 rounded bg-[#484DB5] text-white">
            {serie.is_completed ? "Completa" : "escrevendo..."}
          </span>
        </div>
        
        {serie.cover_url ? (
          <Image
            src={serie.cover_url}
            alt={serie.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 15vw, 12vw"
            className="object-cover"
            priority={index === 0}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#484DB5] text-white text-4xl font-bold">
            {serie.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-2 flex-grow flex flex-col">
        <h3 className="font-bold text-xs line-clamp-2 mb-1">{serie.title}</h3>
        <p className="text-xs text-gray-600 mb-1">
          de {serie.author_name}
        </p>
        {serie.genre && (
          <div className="mb-1">
            <span className="text-xs text-[#484DB5] font-medium">
              › {serie.genre}
            </span>
          </div>
        )}
        <div className="mt-auto flex items-center text-xs text-gray-600">
          <div className="flex items-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-[#484DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {serie.view_count?.toLocaleString("pt-BR") || "0"}
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-[#484DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {serie.chapter_count}
          </div>
        </div>
      </div>
    </Link>
  );
} 