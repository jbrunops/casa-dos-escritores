'use client';

import Link from "next/link";
import Image from "next/image";
import { Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function SeriesCard({ serie, index, showRanking = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.43, 0.13, 0.23, 0.96]
      }}
    >
      <Link
        href={`/series/${serie.id}`}
        className="group flex flex-col rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-[#eaeaea] hover:border-[#484DB5]/40 relative h-full"
      >
        {/* Proporção de imagem ajustada para aproximadamente 2:3 (853x1280) */}
        <div className="relative w-full pt-[150%] overflow-hidden">
          {/* Overlay com gradiente na imagem */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          
          {/* Badge de ranking com animação - posicionado no canto esquerdo inferior */}
          {showRanking && (
            <div className="absolute bottom-2 left-2 bg-[#484DB5] text-white px-3 py-1 text-sm font-bold rounded-full transform group-hover:scale-110 transition-transform duration-300 shadow-md z-20">
              #{index + 1}
            </div>
          )}
          
          {/* Badge de status com animação - mantido no canto direito superior */}
          <div className="absolute top-2 right-2 z-20">
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-black/70 backdrop-blur-sm text-white group-hover:bg-[#484DB5] transition-colors duration-300">
              {serie.is_completed ? "Completa" : "escrevendo..."}
            </span>
          </div>
          
          {serie.cover_url ? (
            <Image
              src={serie.cover_url}
              alt={serie.title}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 15vw, 12vw"
              className="object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
              priority={index < 2}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#484DB5] to-[#6366f1] text-white text-4xl font-bold">
              {serie.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Conteúdo do card com efeito de slide-up */}
        <div className="p-3 flex-grow flex flex-col bg-white transform group-hover:translate-y-[-8px] transition-transform duration-300">
          <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-[#484DB5] transition-colors duration-300">{serie.title}</h3>
          
          <p className="text-xs text-gray-600 mb-2">
            de <span className="font-medium group-hover:text-[#484DB5] transition-colors duration-300">{serie.author_name}</span>
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
        
        {/* Efeito de brilho no hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#484DB5] via-[#6366f1] to-[#484DB5] rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-500"></div>
      </Link>
    </motion.div>
  );
} 