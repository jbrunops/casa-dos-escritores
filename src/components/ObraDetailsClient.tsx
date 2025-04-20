'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, User, Calendar, Edit, Trash2, Type, AlertTriangle, Eye, Book, Plus, Loader2 } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { formatDate, generateSlug, capitalize } from '@/lib/utils';
import { deleteObraAction, deleteChapterAction } from '@/app/actions/obraActions';
import toast from 'react-hot-toast';

// Tipos para os dados - exportados para uso externo
export interface ObraData { // Renomeado e exportado
    id: string;
    title: string | null; // Ajustado para null
    description?: string | null;
    cover_url?: string | null;
    work_type?: string | null;
    tags?: string[] | null;
    created_at?: string | Date | null;
    genre?: string | null; // Adicionado genre se necessário
    is_completed?: boolean;
    author_id: string; // Adicionado author_id
    // Adicionar outros campos que ObraPage.tsx busca
}

export interface ChapterData { // Renomeado e exportado
    id: string;
    title: string | null; // Ajustado para null
    chapter_number: number;
    // Adicionar outros campos que ObraPage.tsx busca
}

export interface AuthorProfileData { // Renomeado e exportado
    id: string;
    username: string | null;
    avatar_url?: string | null; // Adicionado avatar_url se necessário
    // Adicionar outros campos que ObraPage.tsx busca
}

// Props do componente
interface ObraDetailsClientProps {
    obraData: ObraData; // Usar tipo exportado
    chaptersData: ChapterData[]; // Usar tipo exportado
    authorProfileData: AuthorProfileData; // Usar tipo exportado
    isAuthor: boolean;
    // userId?: string | null; // Remover se não for usado
}

interface ItemToDelete {
    type: 'obra' | 'chapter';
    id: string;
}

export default function ObraDetailsClient({
    obraData,
    chaptersData,
    authorProfileData,
    isAuthor,
}: ObraDetailsClientProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);

    const obra = obraData;
    const chapters = chaptersData ?? []; // Garantir que chapters é um array
    const authorProfile = authorProfileData;

    const handleOpenDeleteModal = (type: 'obra' | 'chapter', id: string) => {
        setItemToDelete({ type, id });
        setShowDeleteModal(true);
    };

    const handleCloseModal = () => {
        if (isDeleting) return;
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        let result: { success: boolean; error?: string } = { success: false, error: "Ação não executada." };

        try {
            if (itemToDelete.type === 'obra') {
                result = await deleteObraAction(itemToDelete.id);
                if (result?.success) {
                    toast.success('Obra excluída com sucesso!');
                    router.push('/dashboard');
                }
            } else if (itemToDelete.type === 'chapter') {
                result = await deleteChapterAction(itemToDelete.id);
                if (result?.success) {
                    toast.success('Capítulo excluído com sucesso!');
                    router.refresh();
                }
            }

            if (!result?.success) {
                 // Usar ! para indicar ao TS que result.error pode existir
                toast.error(result.error || `Falha ao excluir ${itemToDelete.type}. Tente novamente.`);
            }

        } catch (error: any) {
            toast.error(`Erro inesperado ao tentar excluir: ${error.message || 'Verifique o console.'}`);
            result = { success: false, error: error.message || 'Erro inesperado no cliente.' };
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const authorUsername = authorProfile?.username ?? 'Autor desconhecido';
    const authorLink = authorProfile?.username ? `/profile/${encodeURIComponent(authorProfile.username)}` : '#';
    const formattedDate = obra?.created_at ? formatDate(obra.created_at) : '-';
    const workTypeLabel = obra?.work_type ? capitalize(obra.work_type) : '-';

    if (!obra || !authorProfile) {
        return <div className="max-w-[75rem] mx-auto px-4 py-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertTriangle size={18}/>Erro ao carregar dados da obra.</div>;
    }

    return (
        <>
            <div className="max-w-[75rem] mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Coluna da esquerda */}
                    <div className="md:w-1/3 flex flex-col items-center">
                        <div className="relative mx-auto overflow-hidden rounded-lg border border-border shadow-md bg-white group mb-4"
                             style={{ width: '20rem', height: '30rem' }}>
                            {obra.cover_url ? (
                                <img
                                    src={obra.cover_url}
                                    alt={`Capa de ${obra.title}`}
                                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                    style={{ background: '#f5f6fd' }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-lg border border-border flex items-center justify-center text-gray-400 shadow-md">
                                    <Book size={64} className="text-primary opacity-70" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {isAuthor && (
                            <div className="flex justify-center gap-2 mt-0 w-full max-w-[20rem]">
                                <button
                                    onClick={() => router.push(`/edit/series/${obra?.id}`)}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/90 text-white rounded-md border border-primary shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors text-sm font-medium flex-1"
                                    title="Editar série"
                                >
                                    <Edit size={16} />
                                    Editar série
                                </button>
                                <button
                                    onClick={() => handleOpenDeleteModal('obra', obra.id)}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-red-500/90 text-white rounded-md border border-red-500 shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors text-sm font-medium flex-1"
                                    title="Excluir série"
                                    disabled={isDeleting && itemToDelete?.type === 'obra'}
                                >
                                    {isDeleting && itemToDelete?.type === 'obra' ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Trash2 size={16} /> }
                                    Excluir série
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Coluna da direita */}
                    <div className="md:w-2/3">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">{obra.title}</h1>
                        <p className="text-gray-700 mb-8">{obra.description || "Sem descrição."}</p>
                        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6">
                            <div className="flex items-center">
                                <User size={18} className="text-primary mr-2" />
                                <span className="text-primary font-medium">Por </span>
                                <Link href={authorLink} className="ml-1 text-primary hover:underline">
                                    {authorUsername}
                                </Link>
                            </div>
                            <div className="flex items-center">
                                <Calendar size={18} className="text-primary-400 mr-2" />
                                <span className="text-gray-700">Criado em: {formattedDate}</span>
                            </div>
                            {workTypeLabel !== '-' && (
                                <div className="flex items-center">
                                    <Type size={18} className="text-primary-400 mr-2" />
                                    <span className="text-gray-700">{workTypeLabel}</span>
                                </div>
                            )}
                        </div>

                        {obra.tags && obra.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {obra.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 text-sm bg-gray-100 border border-border rounded-full text-gray-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <h2 className="text-2xl font-semibold mt-8 mb-4 flex items-center justify-between">
                            <span className="flex items-center text-gray-900">
                                <BookOpen size={24} className="text-primary mr-2" />
                                Capítulos:
                            </span>
                            {isAuthor && (
                                <button
                                    onClick={() => router.push(`/write/chapter/${obra.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-600 transition-colors border border-border text-base"
                                >
                                    <Plus size={18} />
                                    Adicionar Capítulo
                                </button>
                            )}
                        </h2>
                        <div className="space-y-3">
                            {chapters.length > 0 ? (
                                chapters
                                    .sort((a, b) => a.chapter_number - b.chapter_number)
                                    .map((chapter) => (
                                        <div
                                            key={chapter.id}
                                            className="border border-border rounded-lg p-4 flex justify-between items-center bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
                                        >
                                            <div>
                                                <Link
                                                    href={`/ler/${generateSlug(chapter.title, chapter.id)}`}
                                                    className="flex items-center"
                                                >
                                                    <span className="text-lg text-gray-800 hover:text-primary">Capítulo {chapter.chapter_number}: {chapter.title}</span>
                                                </Link>
                                            </div>

                                            <div className="flex gap-2 items-center shrink-0">
                                                <Link
                                                    href={`/ler/${generateSlug(chapter.title, chapter.id)}`}
                                                    className="p-2 text-sm border border-border rounded-md hover:bg-primary hover:text-white transition-colors duration-200 flex items-center"
                                                    title="Ver capítulo"
                                                >
                                                    <Eye size={16} className="mr-1" />
                                                    <span>Ver</span>
                                                </Link>
                                                {isAuthor && (
                                                    <>
                                                        <Link
                                                            href={`/edit/chapter/${chapter.id}?seriesId=${obra.id}`}
                                                            className="p-2 text-sm border border-border rounded-md hover:bg-primary-400 hover:text-white transition-colors duration-200 flex items-center"
                                                            title="Editar capítulo"
                                                        >
                                                            <Edit size={16} className="mr-1" />
                                                            <span>Editar</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleOpenDeleteModal('chapter', chapter.id)}
                                                            disabled={isDeleting && itemToDelete?.id === chapter.id}
                                                            className="p-2 text-sm border border-border rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 flex items-center"
                                                            title="Excluir capítulo"
                                                        >
                                                            {isDeleting && itemToDelete?.id === chapter.id ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Trash2 size={16} className="mr-1" />}
                                                            <span>Excluir</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-500 italic py-8 px-4 border border-dashed border-border rounded-md bg-gray-50">
                                    <BookOpen size={32} className="mb-3 text-primary opacity-60" />
                                    <p>Ainda não há capítulos publicados para esta obra.</p>
                                    {isAuthor && (
                                         <button
                                             onClick={() => router.push(`/write/chapter/${obra.id}`)}
                                             className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-600 transition-colors border border-border text-base"
                                         >
                                             <Plus size={16} className="mr-1" />
                                             Adicionar Primeiro Capítulo
                                         </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação (instância única) */}
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                title={`Confirmar Exclusão (${itemToDelete?.type === 'obra' ? 'Obra' : 'Capítulo'})`}
                message={
                    itemToDelete?.type === 'obra'
                        ? `Tem certeza que deseja excluir a obra "${obra?.title}"? Todos os capítulos também serão excluídos. Esta ação não pode ser desfeita.`
                        : `Tem certeza que deseja excluir este capítulo? Esta ação não pode ser desfeita.`
                }
                confirmText={isDeleting ? "Excluindo..." : "Sim, Excluir"}
                isDeleting={isDeleting}
            />
        </>
    );
} 