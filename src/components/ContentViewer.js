import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, ListOrdered } from 'lucide-react';
import Comments from '@/components/Comments';
import StoryContent from '@/components/StoryContent';
import { formatDate, calculateReadingTime, generateSlug } from '@/lib/utils'; // Supondo que generateSlug está aqui

// Componente reutilizável para exibir o conteúdo de uma história ou capítulo
export default function ContentViewer({
    title,
    content,
    authorProfile,
    createdAt,
    category,
    readingTime, // Pode ser calculado aqui ou passado como prop
    viewCount,
    seriesInfo, // { title, id }
    chapterNumber,
    navigation, // { prevChapter: { id, title, chapter_number }, nextChapter: { id, title, chapter_number } }
    contentType, // 'story' | 'chapter'
    contentId,
    userId, // ID do usuário logado
}) {
    const formattedDate = createdAt ? formatDate(createdAt) : 'Data indisponível';
    const estimatedReadingTime = content ? calculateReadingTime(content) : 0; // Calcular aqui para consistência
    const isChapter = contentType === 'chapter';
    const isStory = contentType === 'story';

    const authorUsername = authorProfile?.username || 'Autor desconhecido';
    const authorAvatar = authorProfile?.avatar_url;
    const authorLink = `/profile/${encodeURIComponent(authorUsername)}`;

    return (
        <div className="py-6 md:py-8"> {/* Remover px-4 daqui, será tratado no layout global */}
            {/* Barra de Navegação (Apenas para Capítulos) - Aplicar max-width */}
            {isChapter && seriesInfo && (
                <div className="max-w-3xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center mb-6 border border-border p-4 rounded-md">
                    {/* Link para a PÁGINA DA OBRA (Série) */}
                    <Link href={`/obra/${generateSlug(seriesInfo.title, seriesInfo.id)}`} className="inline-flex items-center text-gray-700 hover:text-primary transition-colors duration-200 mb-2 sm:mb-0">
                        <ArrowLeft size={16} className="mr-1" />
                        <span className="font-medium">{seriesInfo.title}</span>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                        {/* Link para CAPÍTULO ANTERIOR (usando /ler/) */}
                        {navigation?.prevChapter ? (
                            <Link
                                href={`/ler/${generateSlug(navigation.prevChapter.title, navigation.prevChapter.id)}`}
                                className="inline-flex items-center h-10 px-3 border border-border rounded-md text-gray-700 hover:text-primary hover:border-primary transition-all duration-300 hover:-translate-y-1"
                                title={`Capítulo ${navigation.prevChapter.chapter_number}: ${navigation.prevChapter.title}`}
                            >
                                <ArrowLeft size={16} className="mr-1" />
                                <span>Cap. {navigation.prevChapter.chapter_number}</span>
                            </Link>
                        ) : (
                            <span className="inline-flex items-center h-10 px-3 border border-border rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
                                <ArrowLeft size={16} className="mr-1" />
                                <span>Primeiro</span>
                            </span>
                        )}
                        
                        {/* Link para ÍNDICE (PÁGINA DA OBRA) */}
                        <Link
                            href={`/obra/${generateSlug(seriesInfo.title, seriesInfo.id)}`}
                            className="inline-flex items-center h-10 px-3 border border-border rounded-md text-gray-700 hover:text-primary hover:border-primary transition-all duration-300 hover:-translate-y-1"
                            title="Ver todos os capítulos"
                        >
                            <ListOrdered size={16} className="mr-1" />
                            <span>Índice</span>
                        </Link>
                        
                         {/* Link para PRÓXIMO CAPÍTULO (usando /ler/) */}
                        {navigation?.nextChapter ? (
                            <Link
                                href={`/ler/${generateSlug(navigation.nextChapter.title, navigation.nextChapter.id)}`}
                                className="inline-flex items-center h-10 px-3 border border-border rounded-md text-gray-700 hover:text-primary hover:border-primary transition-all duration-300 hover:-translate-y-1"
                                title={`Capítulo ${navigation.nextChapter.chapter_number}: ${navigation.nextChapter.title}`}
                            >
                                <span>Cap. {navigation.nextChapter.chapter_number}</span>
                                <ArrowRight size={16} className="ml-1" />
                            </Link>
                        ) : (
                            <span className="inline-flex items-center h-10 px-3 border border-border rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
                                <span>Último</span>
                                <ArrowRight size={16} className="ml-1" />
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Conteúdo Principal - Aplicar max-width */}
            <div className="max-w-3xl w-full mx-auto border border-border rounded-md mb-6">
                 {/* Cabeçalho do Conteúdo */}
                 <div className={`p-6 ${isChapter ? 'border-b border-border' : ''}`}>
                    <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isChapter ? 'text-gray-900' : ''}`}>
                        {isChapter && `Capítulo ${chapterNumber}: `}
                        {title}
                    </h1>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Info Autor */}
                        <div className="flex items-center gap-3">
                            {authorAvatar ? (
                                <img
                                    src={authorAvatar}
                                    alt={authorUsername}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                                    {(authorUsername || 'A').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <Link
                                    href={authorLink}
                                    className="font-medium text-gray-900 hover:underline transition-all duration-300"
                                >
                                    {authorUsername}
                                </Link>
                                {/* Metadados */}
                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-x-2 gap-y-1 flex-wrap">
                                    <span>{formattedDate}</span>
                                    {isStory && (
                                        <>
                                            <span>·</span>
                                            <span>{estimatedReadingTime} min para ler</span>
                                        </>
                                    )}
                                    {isStory && category && (
                                         <>
                                            <span>·</span>
                                            <Link
                                                href={`/categories/${category.toLowerCase().replace(/\s+/g, '-')}`}
                                                className="px-2 py-0.5 rounded-full bg-gray-100 border border-border hover:bg-gray-200 transition-colors duration-300"
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
                         {/* Ações (se houver, como botão de editar para autor) - Adicionar depois se necessário */}
                    </div>
                </div>

                {/* Corpo do Conteúdo */}
                <div className="p-6 md:p-8 prose max-w-none prose-img:rounded-lg prose-a:text-primary hover:prose-a:text-opacity-80">
                    <StoryContent content={content} />
                </div>

                 {/* Navegação Inferior (Apenas para Capítulos) */}
                 {isChapter && seriesInfo && (navigation?.prevChapter || navigation?.nextChapter) && (
                    <div className="px-6 pb-6 pt-4 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                        {navigation.prevChapter ? (
                            <Link
                                href={`/ler/${generateSlug(navigation.prevChapter.title, navigation.prevChapter.id)}`}
                                className="inline-flex items-center justify-center h-10 px-4 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                <span className="truncate max-w-[150px] sm:max-w-[200px]">Capítulo {navigation.prevChapter.chapter_number}</span>
                            </Link>
                        ) : <div className='w-full sm:w-auto'></div> /* Espaçador */}

                        <Link 
                            href={`/obra/${generateSlug(seriesInfo.title, seriesInfo.id)}`}
                            className="inline-flex items-center justify-center h-10 px-4 border border-border text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
                        >
                            <ListOrdered size={16} className="mr-2" />
                            <span>Índice</span>
                        </Link>

                        {navigation.nextChapter ? (
                            <Link
                                href={`/ler/${generateSlug(navigation.nextChapter.title, navigation.nextChapter.id)}`}
                                className="inline-flex items-center justify-center h-10 px-4 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
                            >
                                <span className="truncate max-w-[150px] sm:max-w-[200px]">Capítulo {navigation.nextChapter.chapter_number}</span>
                                <ArrowRight size={16} className="ml-2" />
                            </Link>
                        ) : <div className='w-full sm:w-auto'></div> /* Espaçador */}
                    </div>
                 )}
            </div>

            {/* Bloco do Autor (Apenas para Histórias) - Aplicar max-width */}
            {isStory && authorProfile && (
                <div className="max-w-3xl w-full mx-auto mb-6 p-4 border border-border rounded-md bg-gray-50">
                    <Link href={authorLink}>
                        <div className="flex items-center gap-4 hover:bg-gray-100 p-3 rounded-lg transition-all duration-200">
                            {authorAvatar ? (
                                <img
                                    src={authorAvatar}
                                    alt={authorUsername}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-medium">
                                    {(authorUsername || 'A').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-medium">
                                    Escrito por {authorUsername}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Veja mais histórias deste autor visitando seu perfil.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Comentários - Aplicar max-width */}
            <div className="max-w-3xl w-full mx-auto border border-border rounded-md p-6">
                {/* LOGGING: Verificar props passadas para Comments */}
                {console.log("[ContentViewer] Props para Comments:", { contentId, contentType, userId, authorId: authorProfile?.id })}
                <Comments
                    contentId={contentId} // Usar contentId genérico
                    contentType={contentType} // Passar tipo para API/Comments saber se é story ou chapter
                    userId={userId}
                    authorId={authorProfile?.id} // Passar ID do autor
                />
            </div>
        </div>
    );
} 