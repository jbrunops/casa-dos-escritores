"use client";

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import * as React from 'react';

// Props do componente
interface StoryContentProps {
    content: string | null | undefined;
    className?: string; // Manter para customização externa, se necessário
}

export default function StoryContent({ content, className = "" }: StoryContentProps) {
    const [sanitizedContent, setSanitizedContent] = useState<string>("");
    const [isClient, setIsClient] = useState<boolean>(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && content) {
            // Restaurar configuração original de ALLOWED_TAGS/ATTR
            const sanitized = DOMPurify.sanitize(content, {
                USE_PROFILES: { html: true },
                ALLOWED_TAGS: [
                    "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li",
                    "blockquote", "em", "strong", "br", "img", "pre", "code", "span", "div",
                    "figure", "figcaption",
                ],
                ALLOWED_ATTR: [
                    "href", "src", "alt", "class", "style", "target", "rel", "data-align", "align",
                ],
            });
            setSanitizedContent(sanitized);
        } else if (!content) {
            setSanitizedContent("");
        }
    }, [content, isClient]);

    // Manter renderização condicional no cliente
    if (!isClient) {
        // Pode retornar um placeholder mais simples ou null
        return null; // Ou um div simples sem estilo prose
    }

    // Reverter para as classes prose originais
    const originalProseClasses = "prose prose-lg max-w-none text-gray-800 prose-headings:font-bold prose-a:text-[#484DB5] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-blockquote:border-l-[#484DB5] prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic";

    return (
        <div
            // Combinar classes originais com a className opcional
            className={`${originalProseClasses} ${className}`.trim()}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
} 