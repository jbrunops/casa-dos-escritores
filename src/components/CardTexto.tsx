import Link from 'next/link';
import { MessageSquare, BookText } from 'lucide-react';
import { formatDate, generateSlug, capitalize } from '@/lib/utils';
import * as React from 'react';

// Tipo para as propriedades esperadas do card
interface CardTextoProps {
    id: string | number;
    type: 'story' | 'chapter' | 'series';
    title: string;
    summary?: string | null;
    author?: string | null;
    date?: string | Date | null;
    commentsCount?: number | null;
    seriesTitle?: string | null;
    chapterNumber?: number | null;
    seriesId?: string | number | null;
    seriesType?: string | null;
}

// Função auxiliar para determinar o texto e estilo do badge
const getBadgeInfo = (type: CardTextoProps['type'], chapterNumber?: number | null, seriesTitle?: string | null, seriesType?: string | null): { text: string; style: string } => {
    // Reverter para o estilo original do .js
    const baseStyle = 'bg-[#484DB5] text-white'; // Cor específica do original?

    if (type === 'story') {
        return { text: 'Conto Único', style: baseStyle };
    }
    if (type === 'chapter' && seriesTitle && chapterNumber) {
        const prefix = seriesType ? `${capitalize(seriesType)} - ` : '';
        return { text: `${prefix}Cap. ${chapterNumber}`, style: baseStyle };
    }
    return { text: '', style: '' };
};

// Função auxiliar para determinar o link
const getLinkHref = (type: CardTextoProps['type'], title: string, id: string | number, seriesId?: string | number | null): string => {
    let linkUrl = "#";
    const safeId = String(id);
    const safeTitle = title || 'sem-titulo';

    switch (type) {
        case "story":
            linkUrl = `/ler/${safeId}`;
            break;
        case "series":
            linkUrl = `/obra/${generateSlug(safeTitle, safeId)}`;
            break;
        case "chapter":
            linkUrl = `/ler/${safeId}`;
            break;
        default:
            console.warn(`Tipo de card desconhecido: ${type}`);
            linkUrl = "#";
    }
    return linkUrl;
};


export default function CardTexto({
    id,
    type,
    title,
    summary,
    author,
    date,
    commentsCount,
    seriesTitle,
    chapterNumber,
    seriesId,
    seriesType,
}: CardTextoProps) {
    const badge = getBadgeInfo(type, chapterNumber, seriesTitle, seriesType);
    const href = getLinkHref(type, title, id, seriesId);

    const displayAuthor = author ?? 'Autor desconhecido';
    const displayDate = date ? formatDate(date) : 'Data indisponível';
    const displaySummary = summary ?? 'Sem resumo disponível.';

    return (
        <Link
            href={href}
            // Reverter classes para as originais do .js
            className="block relative p-4 rounded-lg border border-border bg-white hover:shadow-lg transition-all duration-300 group"
        >
            {/* Badge */}
            {badge.text && (
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-tr-lg rounded-bl-lg ${badge.style}`}>
                    {badge.text}
                </div>
            )}

            {/* Conteúdo Principal */}
            <div className="pt-5 pr-5"> {/* Manter padding original */}
                {/* Título - Reverter estilos */}
                <h3 className="font-extrabold text-lg mb-2 text-gray-800 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                {/* Série (se for capítulo) - Reverter estilos */}
                {type === 'chapter' && seriesTitle && (
                    <div className="flex items-center text-sm text-primary mb-2">
                        <BookText size={16} className="mr-1.5" />
                        <span>Série: {seriesTitle}</span>
                    </div>
                )}

                {/* Resumo - Reverter estilos */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {displaySummary}
                </p>

                {/* Rodapé - Reverter estilos */}
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-border pt-3 mt-3">
                    <span className="font-medium text-gray-700 truncate pr-2" title={displayAuthor}>{displayAuthor}</span>
                    <div className="flex items-center space-x-3 shrink-0">
                        {typeof commentsCount === 'number' && commentsCount >= 0 && (
                            <div className="flex items-center" title={`${commentsCount} comentários`}>
                                <MessageSquare size={14} className="mr-1 text-primary" />
                                <span>{commentsCount}</span>
                            </div>
                        )}
                        <span title={displayDate}>{displayDate}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
} 