"use client";

import { useEffect, useState } from 'react';

export default function StoryContent({ content }) {
    const [sanitizedContent, setSanitizedContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Importar DOMPurify apenas no cliente
            import('dompurify').then(({ default: DOMPurify }) => {
                const sanitized = DOMPurify.sanitize(content, {
                    USE_PROFILES: { html: true },
                    ALLOWED_TAGS: [
                        "h1",
                        "h2",
                        "h3",
                        "h4",
                        "h5",
                        "h6",
                        "p",
                        "a",
                        "ul",
                        "ol",
                        "li",
                        "blockquote",
                        "em",
                        "strong",
                        "br",
                        "img",
                        "pre",
                        "code",
                        "span",
                        "div",
                        "figure",
                        "figcaption",
                    ],
                    ALLOWED_ATTR: [
                        "href",
                        "src",
                        "alt",
                        "class",
                        "style",
                        "target",
                        "rel",
                        "data-align",
                        "align",
                    ],
                    // Configurações adicionais de segurança
                    FORBID_TAGS: ['script', 'object', 'embed', 'form'],
                    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
                    KEEP_CONTENT: false,
                    RETURN_DOM: false,
                    RETURN_DOM_FRAGMENT: false,
                    SANITIZE_DOM: true
                });
                setSanitizedContent(sanitized);
                setIsLoading(false);
            });
        } else {
            // Server-side: sanitização básica para evitar XSS
            const basicSanitized = (content || '').replace(/<script[^>]*>.*?<\/script>/gi, '');
            setSanitizedContent(basicSanitized);
            setIsLoading(false);
        }
    }, [content]);
    
    // Renderização com fallback seguro
    if (isLoading || !sanitizedContent) {
        return (
            <div className="prose prose-lg max-w-none text-gray-800 font-poppins">
                <p className="text-gray-500">Carregando conteúdo...</p>
            </div>
        );
    }
    
    return (
        <div
            className="prose prose-lg max-w-none text-gray-800 prose-headings:font-bold prose-a:text-[#484DB5] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-blockquote:border-l-[#484DB5] prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic font-poppins"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
}
