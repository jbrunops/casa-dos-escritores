"use client";

import { useMotionValue, motion, useMotionTemplate, MotionProps } from "framer-motion";
import React, { useState, useEffect, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";

// Props para Highlight
interface HighlightProps extends MotionProps {
  children: ReactNode;
  className?: string;
}

// Componente Highlight interno - Reverter estilos
export function Highlight({ children, className, ...rest }: HighlightProps) {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 1.5,
        ease: "linear",
        delay: 0.3,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
       // Reverter estilo do gradiente para o original
      className={`relative inline-block bg-gradient-to-r from-[#484DB5]/30 to-[#484DB5]/6 px-0.5 pb-0.1 rounded-md ${className ?? ""}`}
      {...rest}
    >
      {children}
    </motion.span>
  );
}

// Props para HeroHighlight
interface HeroHighlightProps {
  title?: ReactNode;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
  children?: ReactNode;
}

export function HeroHighlight({
  title,
  subtitle,
  buttonText,
  buttonLink,
  className = "",
  children,
}: HeroHighlightProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [targetLink, setTargetLink] = useState<string>("/signup");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user) {
        setTargetLink("/dashboard/new");
      } else {
        setTargetLink("/signup");
      }
      setIsLoaded(true);
    }

    checkSession();
  }, []);

  // Reverter SVG patterns para o original
  const dotPatterns = {
    default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23E5E7EB' id='pattern-circle' cx='10' cy='10' r='1.5'%3E%3C/circle%3E%3C/svg%3E")`,
    hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23484DB5' id='pattern-circle' cx='10' cy='10' r='1.5'%3E%3C/circle%3E%3C/svg%3E")`,
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const { currentTarget, clientX, clientY } = event;
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    // Reverter bg/text do container
    <div
      className={`group relative flex h-[24rem] w-full items-center justify-center bg-white ${className}`}
      onMouseMove={handleMouseMove}
      style={{ marginBottom: 0, zIndex: 10 }}
    >
      {/* Reverter background padrão */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: dotPatterns.default }}
      />
      {/* Reverter efeito hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: dotPatterns.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(200px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)
          `,
          maskImage: useMotionTemplate`
            radial-gradient(200px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)
          `,
        }}
      />

      {/* Conteúdo centralizado */}
      <div className="relative z-20 max-w-[75rem] mx-auto px-4 sm:px-6 md:px-0 text-center">
         {/* Reverter estilo do título */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {children || title || (
            <>
              <Highlight>Compartilhe suas histórias</Highlight> e conecte-se com outros escritores
            </>
          )}
        </h1>
         {/* Reverter estilo do subtítulo */}
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          {subtitle || "Uma plataforma para escritores expressarem sua criatividade, compartilharem suas obras e receberem feedback valioso da comunidade."}
        </p>
        {/* Reverter botão para link estilizado original */}
        {isLoaded && (
          <Link
            href={buttonLink || targetLink}
            className="h-10 px-6 inline-flex items-center justify-center bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 font-medium"
          >
            {buttonText || "Comece a escrever agora"}
          </Link>
        )}
      </div>
    </div>
  );
} 