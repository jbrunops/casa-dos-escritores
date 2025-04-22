"use client";

import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy
} from "lucide-react";
import { useState } from "react";

export default function ContentFooter({
  author,
  commentCount = 0,
  likeCount = 0,
  onLike,
  isLiked = false,
  contentUrl,
  contentType = "story"
}) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Função para lidar com o like
  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    if (onLike) onLike(!liked);
  };

  // Função para compartilhar
  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
  };

  // Funções para compartilhamento em redes sociais
  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        window.location.href
      )}&text=Confira este ${contentType === "chapter" ? "capítulo" : "artigo"} na Casa dos Escritores`,
      "_blank"
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        window.location.href
      )}`,
      "_blank"
    );
  };

  const shareOnLinkedin = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        window.location.href
      )}`,
      "_blank"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="my-8 border-t border-b border-gray-200 py-8 font-poppins">
      {/* Seção do autor */}
      <div className="mb-8">
        <Link
          href={`/profile/${encodeURIComponent(author?.username || "")}`}
          className="block"
        >
          <div className="flex items-start gap-4 hover:bg-gray-50 p-4 rounded-lg transition-all duration-300 hover:-translate-y-1">
            {/* Avatar do autor */}
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.username || "Autor"}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#484DB5] text-white flex items-center justify-center text-xl font-medium">
                {(author?.username || "A").charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Informações do autor */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Escrito por{" "}
                <span className="text-[#484DB5]">
                  {author?.username || "Autor desconhecido"}
                </span>
              </h3>
              <p className="text-gray-600 mt-1">
                {author?.bio || "Veja mais histórias deste autor visitando seu perfil."}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Barra de interações */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Botão de like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-gray-700 hover:text-[#484DB5] transition-colors duration-200"
          >
            <Heart
              size={20}
              className={`${
                liked ? "fill-[#484DB5] text-[#484DB5]" : ""
              } transition-colors duration-200`}
            />
            <span>{likes}</span>
          </button>

          {/* Link para comentários */}
          <Link
            href="#comments"
            className="flex items-center gap-1 text-gray-700 hover:text-[#484DB5] transition-colors duration-200"
          >
            <MessageSquare size={20} />
            <span>{commentCount}</span>
          </Link>
        </div>

        {/* Botão de compartilhamento */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-gray-700 hover:text-[#484DB5] transition-colors duration-200"
          >
            <Share2 size={20} />
            <span>Compartilhar</span>
          </button>

          {/* Menu de compartilhamento */}
          {showShareOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={shareOnTwitter}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Twitter size={16} />
                  <span>Twitter</span>
                </button>
                <button
                  onClick={shareOnFacebook}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Facebook size={16} />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={shareOnLinkedin}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Copy size={16} />
                  <span>{copySuccess ? "Copiado!" : "Copiar link"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 