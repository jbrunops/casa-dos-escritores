"use client";

import { useEffect, useState } from 'react';

export default function StoryContent({ content }) {
    const [sanitizedContent, setSanitizedContent] = useState("");
    
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
                });
                setSanitizedContent(sanitized);
            });
        }
    }, [content]);
    
    // Renderização com fallback
    return (
        <div
            className="prose prose-purple max-w-none py-4 story-content"
            style={{
                '--tw-prose-headings': '#111827',
                '--tw-prose-links': '#484DB5',
                '--tw-prose-counters': '#484DB5',
                '--tw-prose-bullets': '#484DB5',
                '--tw-prose-quote-borders': '#E5E7EB',
                '--tw-prose-hr': '#E5E7EB',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent || content }}
        />
    );
}
