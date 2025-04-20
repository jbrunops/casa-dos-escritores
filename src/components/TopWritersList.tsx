import Link from 'next/link';
import { BookText, MessageSquare } from 'lucide-react';
import Image from 'next/image'; // Usar Image para otimização
import * as React from 'react';

// Interface para os dados do escritor
interface Writer {
    id: string; // ID do perfil (geralmente UUID)
    username: string | null;
    avatar_url: string | null;
    content_count: number | null;
    // Adicionar outras props se necessário
}

// Props para o item individual
interface WriterRankItemProps {
    writer: Writer;
    rank: number;
}

// Componente para exibir um único escritor no ranking
function WriterRankItem({ writer, rank }: WriterRankItemProps) {
    const writerUsername = writer.username ?? 'Desconhecido';
    const contentCount = writer.content_count ?? 0;

    return (
        <div
            key={writer.id} // Usar id do perfil como chave
            className="flex items-center p-4 md:py-3 md:px-3 rounded-lg border border-border hover:shadow-sm transition-shadow bg-card text-card-foreground"
        >
            <span className="font-bold text-xl w-8 text-center mr-3 text-primary shrink-0">
                {rank}
            </span>

            {/* Avatar ou Inicial */}
            <Link href={`/profile/${writerUsername}`} className="shrink-0 mr-3">
                {writer.avatar_url ? (
                    <Image
                        src={writer.avatar_url}
                        alt={`Avatar de ${writerUsername}`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {writerUsername?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                )}
            </Link>

            {/* Informações do Escritor */}
            <div className="flex-1 min-w-0">
                <Link
                    href={`/profile/${writerUsername}`}
                    className="font-semibold text-base text-foreground hover:text-primary transition-colors block truncate"
                    title={writerUsername}
                >
                    {writerUsername}
                </Link>
                <div className="flex flex-wrap items-center space-x-3 text-sm text-muted-foreground mt-1">
                    <span className="inline-flex items-center">
                        <BookText size={14} className="mr-1 shrink-0" />
                        {contentCount} {contentCount === 1 ? 'publicação' : 'publicações'}
                    </span>
                    {/* Adicionar outras métricas se disponíveis, ex: comentários */}
                </div>
            </div>
        </div>
    );
}

// Props para a lista
interface TopWritersListProps {
    writers: Writer[];
}

export default function TopWritersList({ writers }: TopWritersListProps) {
    if (!writers || writers.length === 0) {
        return <p className="text-muted-foreground italic">Nenhum escritor ativo ainda.</p>;
    }

    return (
        <div className="space-y-3">
            {writers.map((writer, index) => (
                <WriterRankItem writer={writer} rank={index + 1} key={writer.id} />
            ))}
        </div>
    );
} 