'use client';

import Link from "next/link";
import Image from "next/image";
import { Eye, FileText } from "lucide-react";

export default function SeriesCard({ serie, index, showRanking = false }) {
  return (
    <Link
      href={`/series/${serie.id}`}
      className="flex flex-col rounded-lg overflow-hidden bg-white border border-gray-200 hover:border-[#484DB5] hover:shadow-md transition-all duration-200 h-full"
    >
      <div className="relative w-full pt-[150%] overflow-hidden">
        {/* Badge de ranking */}
        {showRanking && (
          <div className="absolute bottom-2 left-2 bg-[#484DB5] text-white px-2 py-1 text-xs font-bold rounded-full z-20">
            #{index + 1}
          </div>
        )}
        
        {/* Badge de status */}
        <div className="absolute top-2 right-2 z-20">
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-black/60 text-white">
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
            priority={index < 2}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#484DB5] to-[#6366f1] text-white text-4xl font-bold">
            {serie.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="p-3 flex-grow flex flex-col bg-white">
        <h3 className="font-bold text-sm line-clamp-2 mb-1 text-gray-900">{serie.title}</h3>
        
        <p className="text-xs text-gray-600 mb-2">
          de <span className="font-medium">{serie.author_name}</span>
        </p>
        
        {serie.genre && (
          <div className="mb-2">
            <span className="text-xs bg-[#484DB5]/10 text-[#484DB5] font-medium px-2 py-1 rounded-full">
              {serie.genre}
            </span>
          </div>
        )}
        
        <div className="mt-auto flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <Eye size={14} className="mr-1 text-[#484DB5]" />
            <span>{serie.view_count?.toLocaleString("pt-BR") || "0"}</span>
          </div>
          
          <div className="flex items-center">
            <FileText size={14} className="mr-1 text-[#484DB5]" />
            <span>{serie.chapter_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
} 