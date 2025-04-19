import Link from 'next/link';
import { MessageSquare, BookText } from 'lucide-react';
import { formatDate, generateSlug } from '@/lib/utils';

// Função auxiliar para determinar o texto e estilo do badge
const getBadgeInfo = (type, chapterNumber, seriesTitle) => {
    if (type === 'story') {
        return { text: 'Conto Único', style: 'bg-indigo-600 text-white' };
    }
    if (type === 'chapter' && seriesTitle && chapterNumber) {
        return { text: `Capítulo ${chapterNumber}`, style: 'bg-indigo-600 text-white' };
    }
    // Adicionar outros tipos (livro, novela) se necessário
    return { text: '', style: '' }; // Padrão ou para séries completas (sem badge no card?)
};

// Função auxiliar para determinar o link
const getLinkHref = (type, title, id, seriesId, seriesTitle) => {
    if (type === 'story') {
        return `/story/${generateSlug(title, id)}`;
    }
    if (type === 'chapter') {
        // Idealmente, o link do capítulo deveria incluir o slug da série também
        // Ex: /series/[series-slug]/chapter/[chapter-slug]
        // Por enquanto, vamos usar o link direto do capítulo:
        return `/chapter/${generateSlug(title, id)}`;
    }
     if (type === 'series') {
        return `/series/${generateSlug(title, id)}`;
    }
    return '#'; // Fallback
};


export default function CardTexto({
    id,
    type, // 'story', 'chapter', 'series'
    title,
    summary,
    author,
    date,
    commentsCount,
    seriesTitle, // Apenas para chapter
    chapterNumber, // Apenas para chapter
    seriesId, // Apenas para chapter/series
    coverUrl, // Apenas para series (no SeriesHighlights) - NÃO USADO NESTE CARD PADRÃO
    genre, // Apenas para series (no SeriesHighlights) - NÃO USADO NESTE CARD PADRÃO
    viewCount, // Apenas para series (no SeriesHighlights) - NÃO USADO NESTE CARD PADRÃO
    status, // Apenas para series (no SeriesHighlights) - NÃO USADO NESTE CARD PADRÃO
}) {
    const badge = getBadgeInfo(type, chapterNumber, seriesTitle);
    const href = getLinkHref(type, title, id, seriesId, seriesTitle);

    return (
        <Link
            href={href}
            className="block relative p-4 rounded-lg border border-border bg-white hover:shadow-lg transition-all duration-300 group"
        >
            {/* Badge */}
            {badge.text && (
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-tr-lg rounded-bl-lg ${badge.style}`}>
                    {badge.text}
                </div>
            )}

            {/* Conteúdo Principal */}
            <div className="pt-5 pr-5"> {/* Padding para não sobrepor o badge */}
                 {/* Título */}
                <h3 className="font-extrabold text-lg mb-2 text-gray-800 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                 {/* Série (se for capítulo) */}
                 {type === 'chapter' && seriesTitle && (
                    <div className="flex items-center text-sm text-primary mb-2">
                        <BookText size={16} className="mr-1.5" />
                        <span>Série: {seriesTitle}</span>
                    </div>
                )}

                {/* Resumo */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {summary}
                </p>

                {/* Rodapé */}
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-border pt-3 mt-3">
                    <span className="font-medium text-gray-700 truncate pr-2">{author}</span>
                    <div className="flex items-center space-x-3">
                         {typeof commentsCount === 'number' && (
                            <div className="flex items-center">
                                <MessageSquare size={14} className="mr-1 text-primary" />
                                <span>{commentsCount}</span>
                            </div>
                        )}
                        <span>{formatDate(date)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
} 