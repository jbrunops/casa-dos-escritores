import Link from 'next/link';
import { createSummary } from '@/lib/utils';
import CardTexto from './CardTexto';

export default function MostCommentedList({ contentList }) {
    if (!contentList || contentList.length === 0) {
        return <p>Nenhuma publicação comentada ainda.</p>;
    }

    return (
        <div className="space-y-4">
            {contentList.map((content) => (
                 <CardTexto
                    key={`commented-${content.type}-${content.id}`}
                    id={content.id}
                    type={content.type}
                    title={content.title}
                    summary={content.summary || createSummary(content.content)}
                    author={content.author_username}
                    date={content.created_at}
                    commentsCount={content.comment_count}
                    seriesTitle={content.series_title}
                    chapterNumber={content.chapter_number}
                    seriesId={content.series_id}
                />
            ))}
        </div>
    );
} 