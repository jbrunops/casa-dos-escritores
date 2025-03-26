"use client";

import DOMPurify from "dompurify";

export default function StoryContent({ content }) {
    // Verificar se o conteúdo é uma string válida e não vazia
    if (!content || typeof content !== "string" || content.trim() === "") {
        return (
            <div className="story-content medium-content empty">
                Conteúdo da história não disponível
            </div>
        );
    }

    // Sanitização do conteúdo para evitar XSS
    const sanitizedContent = DOMPurify.sanitize(content, {
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

    return (
        <div
            className="story-content prose medium-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
}
