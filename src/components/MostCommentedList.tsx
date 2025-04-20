import Link from 'next/link';
import { createSummary } from '@/lib/utils'; // Assumindo que utils.ts existe
import CardTexto from './CardTexto'; // Assumindo que CardTexto será migrado ou já é TSX
import * as React from 'react';

// Definir uma interface para os dados de conteúdo esperados
// Esta interface deve ser refinada com base na estrutura real dos dados
interface ContentItem {
    id: string | number;
    type: 'story' | 'chapter'; // Ou outros tipos possíveis
    title: string;
    summary?: string; // Opcional se puder ser gerado a partir de content
    content?: string; // Necessário se summary não for fornecido
    author_username: string;
    created_at: string | Date; // Data pode ser string ISO ou objeto Date
    comment_count: number;
    series_title?: string; // Opcional, relevante para capítulos
    chapter_number?: number; // Opcional, relevante para capítulos
    series_id?: string | number; // Opcional, relevante para capítulos
    series_type?: string; // Opcional, relevante para capítulos
    coverUrl?: string | null;
    genre?: string | null;
    viewCount?: number | null;
    status?: string | null;
}

// Definir interface para as props do componente
interface MostCommentedListProps {
    contentList: ContentItem[];
}

export default function MostCommentedList({ contentList }: MostCommentedListProps) {
    if (!contentList || contentList.length === 0) {
        return <p className="text-muted-foreground italic">Nenhuma publicação comentada ainda.</p>;
    }

    return (
        <div className="space-y-4">
            {contentList.map((content) => (
                <CardTexto
                    key={`commented-${content.type}-${content.id}`}
                    id={content.id}
                    type={content.type}
                    title={content.title}
                    // Usar content para gerar summary apenas se summary não existir
                    summary={content.summary ?? createSummary(content.content ?? '')}
                    author={content.author_username}
                    date={content.created_at}
                    commentsCount={content.comment_count}
                    seriesTitle={content.series_title}
                    chapterNumber={content.chapter_number}
                    seriesId={content.series_id}
                    seriesType={content.series_type}
                    // Passar as props ausentes
                    coverUrl={content.coverUrl}
                    genre={content.genre}
                    viewCount={content.viewCount}
                    status={content.status}
                />
            ))}
        </div>
    );
} 