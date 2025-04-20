import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, ListOrdered } from 'lucide-react';
import Comments from '@/components/Comments'; // Assumir que será migrado
import StoryContent from '@/components/StoryContent'; // Usar .tsx
import { formatDate, calculateReadingTime, generateSlug } from '@/lib/utils'; // Usar .ts
import * as React from 'react';

// Tipos específicos para melhor clareza
type ContentType = 'story' | 'chapter';

// --- Exported Interfaces ---
export interface AuthorProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
}

export interface SeriesInfo {
    id: string | number;
    title: string;
}

interface ChapterRef { // Não precisa exportar, usado internamente por NavigationInfo
    id: string | number;
    title: string;
    chapter_number: number;
}

export interface NavigationInfo {
    prevChapter: ChapterRef | null;
    nextChapter: ChapterRef | null;
}

// --- Component Props Interface ---
interface ContentViewerProps {
    title: string;
    content: string | null;
    authorProfile: AuthorProfile | null;
    createdAt: string | Date | null;
    category?: string | null;
    readingTime?: number; // Pode ser calculado aqui
    viewCount?: number | null;
    seriesInfo?: SeriesInfo | null;
    chapterNumber?: number | null;
    navigation?: NavigationInfo | null;
    contentType: ContentType;
    contentId: string | number; // ID da história ou capítulo atual
    userId?: string | null; // ID do usuário logado para Comments
}

// Componente reutilizável para exibir o conteúdo de uma história ou capítulo
export default function ContentViewer({
    title,
    content,
    authorProfile,
    createdAt,
    category,
    readingTime, // Não usado diretamente, calculado abaixo
    viewCount,
    seriesInfo,
    chapterNumber,
    navigation,
    contentType,
    contentId,
    userId,
}: ContentViewerProps) {
    const formattedDate = createdAt ? formatDate(createdAt) : 'Data indisponível';
    const estimatedReadingTime = content ? calculateReadingTime(content) : 0;
    const isChapter = contentType === 'chapter';
    const isStory = contentType === 'story';

    const authorUsername = authorProfile?.username ?? 'Autor desconhecido';
    const authorAvatar = authorProfile?.avatar_url;
    const authorLink = authorProfile?.username ? `/profile/${encodeURIComponent(authorProfile.username)}` : '#';

    const renderNavButton = (chapter: ChapterRef | null, direction: 'prev' | 'next') => {
        const isDisabled = !chapter;
        const Icon = direction === 'prev' ? ArrowLeft : ArrowRight;
        let label = direction === 'prev' ? 'Primeiro' : 'Último';
        if (chapter) {
            label = `Cap. ${chapter.chapter_number}`;
        }
        const href = chapter ? `/ler/${generateSlug(chapter.title, chapter.id)}` : '#';
        const titleAttr = chapter ? `${chapter.chapter_number}: ${chapter.title}` : '';
        const commonClasses = "inline-flex items-center h-10 px-3 border border-border rounded-md transition-all duration-300";
        const activeClasses = "text-gray-700 hover:text-primary hover:border-primary hover:-translate-y-1";
        const disabledClasses = "text-gray-400 bg-gray-50 cursor-not-allowed";

        const buttonContent = (
            <>
                {direction === 'prev' && <Icon size={16} className="mr-1 shrink-0" />}
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{label}</span>
                {direction === 'next' && <Icon size={16} className="ml-1 shrink-0" />}
            </>
        );

        if (isDisabled) {
            return (
                <span className={`${commonClasses} ${disabledClasses}`}>
                    {buttonContent}
                </span>
            );
        }

        return (
            <Link href={href} title={titleAttr} className={`${commonClasses} ${activeClasses}`}>
                {buttonContent}
            </Link>
        );
    };

    const renderIndexLink = () => (
        <Link
            href={`/obra/${generateSlug(seriesInfo!.title, seriesInfo!.id)}`}
            className="inline-flex items-center h-10 px-3 border border-border rounded-md text-gray-700 hover:text-primary hover:border-primary transition-all duration-300 hover:-translate-y-1"
            title="Ver todos os capítulos"
        >
            <ListOrdered size={16} className="mr-1" />
            <span>Índice</span>
        </Link>
    );

    const renderSeriesLink = () => (
        <Link href={`/obra/${generateSlug(seriesInfo!.title, seriesInfo!.id)}`} className="inline-flex items-center text-gray-700 hover:text-primary transition-colors duration-200 mb-2 sm:mb-0">
            <ArrowLeft size={16} className="mr-1" />
            <span className="font-medium truncate max-w-[150px]">{seriesInfo!.title}</span>
        </Link>
    );

    return (
        <div className="py-6 md:py-8">
            {/* Barra de Navegação (Capítulos) */}
            {isChapter && seriesInfo && (
                <div className="max-w-3xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center mb-6 border border-border p-4 rounded-md">
                    {renderSeriesLink()}
                    <div className="flex items-center gap-2">
                         {renderNavButton(navigation?.prevChapter ?? null, 'prev')}
                         {renderIndexLink()}
                         {renderNavButton(navigation?.nextChapter ?? null, 'next')}
                    </div>
                </div>
            )}

            {/* Conteúdo Principal */}
            <article className="max-w-3xl w-full mx-auto border border-border rounded-md mb-6 overflow-hidden">
                 {/* Cabeçalho do Conteúdo */}
                 <header className={`p-6 ${isChapter ? 'border-b border-border' : ''}`}>
                    <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isChapter ? 'text-gray-900' : ''}`}>
                        {isChapter && chapterNumber && <span className="text-muted-foreground font-normal">Capítulo {chapterNumber}: </span>}
                        {title}
                    </h1>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Info Autor */}
                        {authorProfile && (
                             <div className="flex items-center gap-3">
                                <Link href={authorLink} className="shrink-0">
                                    {authorAvatar ? (
                                        <img
                                            src={authorAvatar}
                                            alt={authorUsername}
                                            className="w-12 h-12 rounded-full object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium text-lg">
                                            {(authorUsername || 'A').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <div>
                                    <Link
                                        href={authorLink}
                                        className="font-medium text-gray-900 hover:underline transition-all duration-300"
                                    >
                                        {authorUsername}
                                    </Link>
                                    {/* Metadados */}
                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-x-2 gap-y-1 flex-wrap mt-1">
                                        <span>{formattedDate}</span>
                                        {isStory && (
                                            <>
                                                <span>·</span>
                                                <span>{estimatedReadingTime} min leitura</span>
                                            </>
                                        )}
                                        {isStory && category && (
                                             <>
                                                <span>·</span>
                                                <Link
                                                    href={`/categories/${generateSlug(category, category)}`}
                                                    className="px-2 py-0.5 rounded-full bg-gray-100 border border-border hover:bg-gray-200 transition-colors duration-300 text-xs"
                                                >
                                                    {category}
                                                </Link>
                                            </>
                                        )}
                                        {isStory && viewCount !== undefined && viewCount !== null && (
                                             <>
                                                <span className='hidden sm:inline'>·</span>
                                                <span className="flex items-center gap-1" title="Visualizações">
                                                    <Eye size={14} className="text-primary" /> {viewCount.toLocaleString('pt-BR')}
                                                </span>
                                             </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Corpo do Conteúdo */}
                <div className="p-6 md:p-8">
                     {content ? (
                        <StoryContent content={content} />
                    ) : (
                        <p className="text-muted-foreground italic">Conteúdo não disponível.</p>
                    )}
                </div>

                 {/* Navegação Inferior (Capítulos) */}
                 {isChapter && seriesInfo && (navigation?.prevChapter || navigation?.nextChapter) && (
                    <footer className="px-6 pb-6 pt-4 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                         {renderNavButton(navigation?.prevChapter ?? null, 'prev')}
                         {renderIndexLink()}
                         {renderNavButton(navigation?.nextChapter ?? null, 'next')}
                    </footer>
                 )}
            </article>

            {/* Bloco do Autor (Histórias) */}
            {isStory && authorProfile && (
                <aside className="max-w-3xl w-full mx-auto mb-6 p-4 border border-border rounded-md bg-gray-50">
                    <Link href={authorLink} className="block group">
                        <div className="flex items-center gap-4 group-hover:bg-gray-100 p-3 rounded-lg transition-all duration-200">
                            {authorAvatar ? (
                                <img
                                    src={authorAvatar}
                                    alt={authorUsername}
                                    className="w-16 h-16 rounded-full object-cover border border-border"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-medium">
                                    {(authorUsername || 'A').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary">
                                    Escrito por {authorUsername}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Veja mais histórias deste autor.
                                </p>
                            </div>
                        </div>
                    </Link>
                </aside>
            )}

            {/* Comentários */}
            <section id="comments" className="max-w-3xl w-full mx-auto border border-border rounded-md p-6">
                 <h2 className="text-2xl font-bold mb-4">Comentários</h2>
                <Comments
                    contentId={String(contentId)} // Garantir que ID é string
                    contentType={contentType}
                    userId={userId ?? undefined} // Passar undefined se nulo
                />
            </section>
        </div>
    );
} 