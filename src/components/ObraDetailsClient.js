'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Usado para redirecionamento/refresh
import { BookOpen, User, Calendar, Edit, Trash2, Type, AlertTriangle, Eye, Book, Plus } from 'lucide-react'; 
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { formatDate, generateSlug, capitalize } from '@/lib/utils'; // Assume que capitalize está em utils
// Importar as Server Actions
import { deleteObraAction /*, deleteChapterAction */ } from '@/app/actions/obraActions'; // <<< Importando a ação de exclusão

export default function ObraDetailsClient({ 
    obraData,
    chaptersData,
    authorProfileData,
    isAuthor,
    // Não precisamos mais passar as ações como props
}) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'obra' | 'chapter', id: string }

    // Renomeando props para evitar conflito com variáveis locais se necessário
    const obra = obraData;
    const chapters = chaptersData;
    const authorProfile = authorProfileData;

    const handleOpenDeleteModal = (type, id) => {
        setItemToDelete({ type, id });
        setShowDeleteModal(true);
    };

    const handleCloseModal = () => {
        if (isDeleting) return; // Não fechar se estiver excluindo
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        console.log(`Tentando excluir ${itemToDelete.type} com ID: ${itemToDelete.id}`);

        try {
            let result = { success: false, error: "Tipo de item inválido." };
            if (itemToDelete.type === 'obra') {
                // --- CHAMADA REAL DA SERVER ACTION ---
                result = await deleteObraAction(itemToDelete.id);
                if (result?.success) {
                    console.log("Obra excluída com sucesso pelo servidor.");
                    alert("Obra excluída com sucesso!"); // Feedback temporário
                    router.push('/dashboard'); // Redirecionar após sucesso
                } 
            } else if (itemToDelete.type === 'chapter') {
                 // --- CHAMADA REAL DA SERVER ACTION (QUANDO ATIVADA) ---
                // result = await deleteChapterAction(itemToDelete.id);
                alert('(Simulado) Excluindo capítulo...'); result = { success: true }; // Placeholder
                if(result?.success) {
                    console.log("Capítulo excluído com sucesso (simulado).");
                    router.refresh(); // Atualiza a página atual
                }
            }
            
            // Se a ação do servidor falhou, lança um erro para o catch
            if (!result?.success) {
                throw new Error(result?.error || `Falha ao excluir ${itemToDelete.type}.`);
            }

            // Fechar modal apenas se a exclusão foi bem-sucedida
            handleCloseModal(); 

        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert(`Erro ao excluir ${itemToDelete.type}: ${error.message}`);
            setIsDeleting(false); // Reabilita botões em caso de erro
        } 
        // Não precisa do finally aqui, pois só reabilitamos no erro
    };

    // Lógica de formatação e links
    const authorUsername = authorProfile?.username || 'Autor desconhecido';
    const authorLink = `/profile/${encodeURIComponent(authorUsername)}`;
    const formattedDate = formatDate(obra?.created_at);
    const workTypeLabel = capitalize(obra?.work_type || '');

    // Adicionar verificação se os dados essenciais estão faltando
    if (!obra || !authorProfile) {
        // Pode mostrar uma mensagem de erro mais específica ou um loader
        // Idealmente, o Server Component já teria retornado notFound()
        return <div className="max-w-[75rem] mx-auto px-4 py-8 text-center text-red-500">Erro ao carregar dados da obra.</div>;
    }

    return (
        <>
            <div className="max-w-[75rem] mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Coluna da esquerda - Imagem da capa */}
                    <div className="md:w-1/3 relative">
                        {/* Botões de ações da série (na parte superior) */}
                        {isAuthor && (
                            <div className="absolute right-2 top-2 flex gap-2 z-10">
                                <button 
                                    onClick={() => router.push(`/write/series?id=${obra?.id}`)}
                                    className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md text-primary border border-border transition-all duration-200"
                                    title="Editar série"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleOpenDeleteModal('obra', obra?.id)}
                                    className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md text-red-500 border border-border transition-all duration-200"
                                    title="Excluir série"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                        
                        {/* Capa do livro com melhor tratamento e exibição */}
                        {obra?.cover_url ? (
                            <div className="relative mx-auto overflow-hidden rounded-lg border border-border shadow-md bg-white group"
                                style={{ width: '20.9375rem', height: '31.375rem' }}>
                                <img 
                                    src={obra.cover_url} 
                                    alt={`Capa de ${obra.title}`}
                                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                    style={{ background: '#f5f6fd' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        ) : (
                            <div className="mx-auto bg-gray-100 rounded-lg border border-border flex items-center justify-center text-gray-400 shadow-md"
                                style={{ width: '20.9375rem', height: '31.375rem' }}>
                                <Book size={64} className="text-primary opacity-70" />
                            </div>
                        )}
                        
                        {/* Status da obra - abaixo da capa */}
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary border border-border shadow-sm">
                                <BookOpen size={18} className="mr-2" />
                                <span>{obra?.is_completed ? 'Concluída' : 'Em andamento'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Coluna da direita - Informações e capítulos */}
                    <div className="md:w-2/3">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">{obra?.title}</h1>
                        <p className="text-gray-700 mb-8">{obra?.description}</p>
                        
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
                            {workTypeLabel && (
                                <div className="flex items-center">
                                    <Type size={18} className="text-primary-400 mr-2" />
                                    <span className="text-gray-700">{workTypeLabel}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {obra?.tags && obra.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 text-sm bg-gray-100 border border-border rounded-full text-gray-700">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        
                        <h2 className="text-2xl font-semibold mt-8 mb-4 flex items-center justify-between">
                            <span className="flex items-center">
                                <BookOpen size={24} className="text-primary mr-2" />
                                Capítulos:
                            </span>
                            {isAuthor && (
                                <button
                                    onClick={() => router.push(`/write/chapter/${obra?.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-600 transition-colors border border-border text-base"
                                >
                                    <Plus size={18} />
                                    Adicionar Capítulo
                                </button>
                            )}
                        </h2>
                        <div className="space-y-3">
                            {chapters && chapters.length > 0 ? (
                                chapters.map((chapter) => (
                                    <div 
                                        key={chapter.id} 
                                        className="border border-border rounded-lg p-4 flex justify-between items-center bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
                                    >
                                        <div>
                                            <Link 
                                                href={`/ler/${generateSlug(chapter.title, chapter.id)}`}
                                                className="flex items-center"
                                            >
                                                <span className="text-lg">Capítulo {chapter.chapter_number}: {chapter.title}</span>
                                            </Link>
                                        </div>
                                        
                                        <div className="flex gap-2">
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
                                                        href={`/write/chapter?id=${chapter.id}&seriesId=${obra?.id}`}
                                                        className="p-2 text-sm border border-border rounded-md hover:bg-primary-400 hover:text-white transition-colors duration-200 flex items-center"
                                                        title="Editar capítulo"
                                                    >
                                                        <Edit size={16} className="mr-1" />
                                                        <span>Editar</span>
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleOpenDeleteModal('chapter', chapter.id)}
                                                        className="p-2 text-sm border border-border rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 flex items-center"
                                                        title="Excluir capítulo"
                                                    >
                                                        <Trash2 size={16} className="mr-1" />
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmação */}
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title={itemToDelete?.type === 'obra' ? 'Excluir Obra?' : 'Excluir Capítulo?'}
                message={
                    itemToDelete?.type === 'obra' 
                        ? "Tem certeza que deseja excluir esta obra permanentemente? Todos os seus capítulos e dados associados serão perdidos."
                        : "Tem certeza que deseja excluir este capítulo permanentemente?"
                }
            />
        </>
    );
} 