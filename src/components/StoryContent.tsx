"use client";

import { useEffect, useState } from "react";

interface StoryContentProps {
  content: string;
}

export default function StoryContent({ content }: StoryContentProps) {
  const [sanitizedContent, setSanitizedContent] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("dompurify").then(({ default: DOMPurify }) => {
        const sanitized = DOMPurify.sanitize(content, {
          USE_PROFILES: { html: true },
          ALLOWED_TAGS: [
            "h1","h2","h3","h4","h5","h6","p","a","ul","ol","li","blockquote","em","strong","br","img","pre","code","span","div","figure","figcaption"
          ],
          ALLOWED_ATTR: [
            "href","src","alt","class","style","target","rel","data-align","align"
          ],
        });
        setSanitizedContent(sanitized);
      });
    }
  }, [content]);

  return (
    <div
      className="prose prose-lg max-w-none text-gray-800 prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-blockquote:border-l-primary prose-blockquote:border-l-4 border-border prose-blockquote:pl-4 prose-blockquote:italic"
      dangerouslySetInnerHTML={{ __html: sanitizedContent || content }}
    />
  );
}
