import Link from 'next/link';
import { createSummary } from '@/lib/utils';
import CardTexto from './CardTexto';
import * as React from 'react';

// Reutilizar a interface ContentItem (ou definir uma específica se os dados forem diferentes)
// Idealmente, esta interface viria de um arquivo de tipos compartilhado
interface ContentItem {
    id: string | number;
    type: 'story' | 'chapter';
    title: string;
    summary?: string;
    content?: string;
    author_username: string;
    created_at: string | Date;
    comment_count?: number | null; // Tornar opcional, pode não ser relevante aqui
    series_title?: string;
    chapter_number?: number;
    series_id?: string | number;
    series_type?: string;
    // Adicionar props esperadas por CardTexto como opcionais
    coverUrl?: string | null;
    genre?: string | null;
    viewCount?: number | null;
    status?: string | null;
}

interface RecentContentListProps {
    contentList: ContentItem[];
}

export default function RecentContentList({ contentList }: RecentContentListProps) {
    if (!contentList || contentList.length === 0) {
        return <p className="text-muted-foreground italic">Nenhuma publicação recente ainda.</p>;
    }

    return (
        <div className="space-y-4">
            {contentList.map((content) => (
                <CardTexto
                    key={`recent-${content.type}-${content.id}`}
                    // Passar todas as props de content que CardTexto espera
                    // Usar `??` para fornecer fallbacks se necessário
                    id={content.id}
                    type={content.type}
                    title={content.title}
                    summary={content.summary ?? createSummary(content.content ?? '')}
                    author={content.author_username}
                    date={content.created_at}
                    commentsCount={content.comment_count ?? 0} // Fallback para commentsCount
                    seriesTitle={content.series_title}
                    chapterNumber={content.chapter_number}
                    seriesId={content.series_id}
                    seriesType={content.series_type}
                    coverUrl={content.coverUrl}
                    genre={content.genre}
                    viewCount={content.viewCount}
                    status={content.status}
                />
            ))}
        </div>
    );
} 