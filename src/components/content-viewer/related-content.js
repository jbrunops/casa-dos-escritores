"use client";

import Link from "next/link";
import { createSummary, generateSlug } from "@/lib/utils";

export default function RelatedContent({ items = [], type = "story" }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="my-12 font-poppins">
      <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-2">
        {type === "chapter" ? "Mais capítulos desta série" : "Mais histórias que você pode gostar"}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.slice(0, 3).map((item) => (
          <RelatedItem key={item.id} item={item} type={type} />
        ))}
      </div>
    </div>
  );
}

function RelatedItem({ item, type }) {
  // Preparar URL adequada com base no tipo
  const itemUrl = type === "chapter" 
    ? `/chapter/${generateSlug(item.title, item.id)}`
    : `/story/${generateSlug(item.title, item.id)}`;

  // Preparar texto de resumo
  const summary = item.summary || createSummary(item.content, 120);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      {item.cover_url && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={item.cover_url} 
            alt={item.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Número do capítulo (se aplicável) */}
        {type === "chapter" && item.chapter_number && (
          <div className="text-sm text-gray-500 mb-1">
            Capítulo {item.chapter_number}
          </div>
        )}
        
        {/* Título */}
        <Link href={itemUrl}>
          <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-[#484DB5] transition-colors duration-200">
            {item.title}
          </h3>
        </Link>
        
        {/* Resumo */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {summary}
        </p>
        
        {/* Autor (se disponível) */}
        {item.profiles && (
          <div className="flex items-center gap-2">
            {item.profiles.avatar_url ? (
              <img
                src={item.profiles.avatar_url}
                alt={item.profiles.username || "Autor"}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#484DB5] text-white flex items-center justify-center text-xs">
                {(item.profiles.username || "A").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700">
              {item.profiles.username || "Autor desconhecido"}
            </span>
          </div>
        )}
        
        {/* Metadados adicionais */}
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          {item.created_at && (
            <span>
              {new Date(item.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          
          {item.view_count !== undefined && (
            <span>{item.view_count} visualizações</span>
          )}
        </div>
      </div>
    </div>
  );
} 