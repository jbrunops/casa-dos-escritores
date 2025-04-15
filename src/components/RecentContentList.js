import Link from 'next/link';
import { createSummary, formatDate, generateSlug } from '@/lib/utils';
import { Book } from 'lucide-react';

export default function RecentContentList({ contentList }) {
    if (!contentList || contentList.length === 0) {
        return <p>Nenhuma publicação recente ainda.</p>;
    }

    return (
        <div className="space-y-4">
            {contentList.map((content) =>
                content.type === 'story' ? (
                    <Link
                        href={`/story/${generateSlug(content.title, content.id)}`}
                        key={`recent-story-${content.id}`}
                        className="block py-4 px-4 md:px-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-lg">{content.title}</h3>
                        <div className="flex justify-between text-sm text-gray-600 mt-1 mb-2">
                            <span className="font-bold text-[#484DB5]">
                                {content.author_username}
                            </span>
                            <span className="text-xs">
                                {formatDate(content.created_at)}
                            </span>
                        </div>
                        <p className="text-gray-700">
                            {createSummary(content.content)}
                        </p>
                    </Link>
                ) : ( // content.type === 'chapter'
                    <Link
                        href={`/chapter/${generateSlug(content.title, content.id)}`}
                        key={`recent-chapter-${content.id}`}
                        className="block relative py-4 px-4 md:px-4 rounded-lg border border-[#E5E7EB] bg-gray-50 hover:shadow-md transition-shadow"
                    >
                        <div className="absolute top-0 right-0 px-2 py-1 bg-[#484DB5] text-white text-xs rounded-tr-lg">
                            Capítulo {content.chapter_number || '?'}
                        </div>
                        <h3 className="font-semibold text-lg mt-2 mb-3">{content.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1 mb-2">
                            <span className="mr-2">
                                <span className="font-semibold">Série:</span>{" "}
                                <span
                                    className="inline-flex items-center bg-[#484DB5]/10 text-[#484DB5] px-2 py-0.5 rounded-md">
                                    <Book size={14} className="mr-1" />
                                    {content.series_title || 'N/A'}
                                </span>
                            </span>
                        </div>
                        <p className="text-gray-700 my-4">
                            {createSummary(content.content)}
                        </p>
                        <div className="flex justify-between text-sm text-gray-600 mt-4 pt-3 border-t border-[#E5E7EB]">
                            <span className="font-bold text-[#484DB5]">
                                {content.author_username}
                            </span>
                            <span className="text-xs">
                                {formatDate(content.created_at)}
                            </span>
                        </div>
                    </Link>
                )
            )}
        </div>
    );
} 