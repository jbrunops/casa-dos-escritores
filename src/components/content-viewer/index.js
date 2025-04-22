"use client";

import { useState, useEffect } from "react";
import ContentHeader from "./content-header";
import ContentNavigation from "./content-navigation";
import ContentFooter from "./content-footer";
import RelatedContent from "./related-content";
import StoryContent from "../StoryContent";
import Comments from "../Comments";
import { ArrowUp } from "lucide-react";

export default function ContentViewer({
  // Dados comuns
  id,
  title,
  content,
  createdAt,
  author,
  viewCount,
  relatedItems,
  userId,
  
  // Específicos por tipo
  contentType = "story", // 'story' ou 'chapter'
  
  // Para stories
  subtitle,
  category,
  
  // Para chapters
  chapterNumber,
  seriesId,
  seriesTitle,
  prevChapter,
  nextChapter,
}) {
  // Estado para controlar barra de progresso e botão de voltar ao topo
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitorar scroll para atualizar barra de progresso
  useEffect(() => {
    const updateScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative font-poppins">
      {/* Barra de progresso de leitura fixa no topo */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-[#484DB5]"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Cabeçalho */}
        <ContentHeader
          title={title}
          subtitle={subtitle}
          author={author}
          seriesId={seriesId}
          publishDate={createdAt}
          contentType={contentType}
          category={category}
          viewCount={viewCount}
          content={content}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber}
        />

        {/* Navegação superior (apenas para contentType === "chapter") */}
        {contentType === "chapter" && (
          <ContentNavigation
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            seriesId={seriesId}
            seriesTitle={seriesTitle}
            currentChapterNumber={chapterNumber}
            showBorders={true} // Mostrar bordas apenas na navegação superior
          />
        )}

        {/* Conteúdo */}
        <div className="prose prose-lg max-w-none text-gray-800 mb-8 font-poppins">
          <StoryContent content={content} />
        </div>

        {/* Navegação inferior (para capítulos) */}
        {contentType === "chapter" && (
          <ContentNavigation
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            seriesId={seriesId}
            seriesTitle={seriesTitle}
            currentChapterNumber={chapterNumber}
            showBorders={false} // Não mostrar bordas na navegação inferior
          />
        )}

        {/* Rodapé com informações do autor e ações */}
        <ContentFooter
          author={author}
          contentType={contentType}
          commentCount={0} // Pode ser implementado depois
          likeCount={0}    // Pode ser implementado depois
        />

        {/* Conteúdo relacionado */}
        {relatedItems && relatedItems.length > 0 && (
          <RelatedContent items={relatedItems} type={contentType} />
        )}

        {/* Seção de comentários */}
        <div id="comments" className="mt-8 border border-gray-200 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Comentários</h2>
          <Comments
            storyId={contentType === "story" ? id : undefined}
            contentId={contentType === "chapter" ? id : undefined}
            contentType={contentType}
            userId={userId}
            authorId={author?.id}
            isSeriesComment={false}
          />
        </div>
      </div>

      {/* Botão para voltar ao topo */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-white rounded-full shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 z-50"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
} 