"use client";

import React from 'react';
import TipTapEditor from "@/components/TipTapEditor";
import {
    FileText,
    BookOpen,
    Clock,
    Save, // Para botão de salvar rascunho/atualizar
    Send, // Para botão de publicar
    Trash2, // Para botão de excluir
    Loader2 // Para indicar carregamento do número do capítulo
} from "lucide-react";

// Componentes e hooks específicos para ChapterEditor serão importados aqui
// ex: import TipTapEditor from '@/components/TipTapEditor';
// ex: import useTextStats from '@/hooks/useTextStats';

export default function ChapterEditor(props) {
    const {
        // Props de estado e setters (do ContentEditor)
        currentTitle, setCurrentTitle,
        currentContent, setCurrentContent,
        chapterNumber, // Este é o estado para o número do capítulo
        // setChapterNumber, // O número do capítulo é geralmente carregado ou fixo na edição
        loadingChapterNumber, // boolean: true enquanto busca o próximo número do capítulo
        
        // Props de controle de UI e ações (do ContentEditor)
        handleSubmit, // (event, isDraft) => void
        handleDelete, // () => void
        saving, 
        publishing, 
        isDeleting,
        formTouched,
        isEditingMode, // boolean: true se estiver editando, false se criando
        showDeleteModal, setShowDeleteModal, // Para controlar o modal de exclusão

        // Props de estatísticas (do useTextStats, passadas pelo ContentEditor)
        wordCount,
        charCount,
        readingTime,

        // Props específicas para capítulo
        seriesId, // ID da série à qual este capítulo pertence (importante!)
        // seriesData, // Dados da série, se necessário para exibir nome da série, etc. (opcional aqui)

        type // Deveria ser "chapter"
    } = props;

    // Lógica para texto e ícone dos botões, similar ao StoryEditor
    const saveDraftButtonText = isEditingMode ? "Atualizar Rascunho" : "Salvar Rascunho";
    const publishButtonText = isEditingMode ? "Atualizar Capítulo" : "Publicar Capítulo";

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Seção de título e número do capítulo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="chapter-title" className="block text-sm font-medium text-gray-700">
                        Título do Capítulo*
                    </label>
                    <input
                        id="chapter-title"
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                        placeholder="Título do seu capítulo..."
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="chapter-number-display" className="block text-sm font-medium text-gray-700">
                        Número do Capítulo*
                    </label>
                    {
                        !isEditingMode && loadingChapterNumber ? (
                            <div className="flex items-center text-gray-500 h-10 px-3 border border-[#E5E7EB] rounded-md bg-gray-100">
                                <Loader2 className="animate-spin mr-2" size={16} />
                                Buscando próximo número...
                            </div>
                        ) : (
                            <input
                                id="chapter-number-display"
                                type="number"
                                min="1"
                                value={chapterNumber} // chapterNumber vem das props
                                readOnly // O número do capítulo é gerenciado automaticamente
                                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200 bg-gray-100 cursor-not-allowed"
                                required
                            />
                        )
                    }
                    <p className="text-xs text-gray-500">
                        {isEditingMode
                            ? "O número do capítulo não pode ser alterado."
                            : "Este número é determinado automaticamente."
                        }
                    </p>
                </div>
            </div>

            {/* Editor de conteúdo */}
            <div className="space-y-2">
                <label htmlFor="chapter-content" className="block text-sm font-medium text-gray-700">
                    Conteúdo*
                </label>
                <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
                    <TipTapEditor
                        value={currentContent}
                        onChange={setCurrentContent} // Passando diretamente o setter do ContentEditor
                        placeholder="Comece a escrever seu capítulo aqui..."
                    />
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                        <FileText size={16} className="mr-1" />
                        <span>{wordCount} palavras</span>
                    </div>
                    <div className="flex items-center">
                        <BookOpen size={16} className="mr-1" />
                        <span>{charCount} caracteres</span>
                    </div>
                    <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        <span>{readingTime} min. de leitura</span>
                    </div>
                </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-8 pt-6 border-t border-gray-200">
                {isEditingMode && (
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)} // setShowDeleteModal vem das props
                        disabled={saving || publishing || isDeleting}
                        className="w-full sm:w-auto h-10 px-4 inline-flex items-center justify-center gap-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-last sm:order-first"
                    >
                        <Trash2 size={16} />
                        Excluir Capítulo
                    </button>
                )}
                
                {isEditingMode && <div className="hidden sm:block sm:flex-grow"></div>}

                <button
                    type="button" 
                    onClick={(e) => handleSubmit(e, true)} // Salvar como rascunho
                    disabled={saving || publishing || isDeleting || !formTouched}
                    className="w-full sm:w-auto h-10 px-4 inline-flex items-center justify-center gap-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditingMode ? <Save size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                    {saveDraftButtonText}
                </button>
                <button
                    type="submit" // Publicar/Atualizar
                    disabled={saving || publishing || isDeleting || !formTouched}
                    className="w-full sm:w-auto h-10 px-6 inline-flex items-center justify-center gap-2 bg-[#484DB5] text-white rounded-md hover:bg-[#484DB5]/90 focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditingMode ? <Save size={16} className="mr-2" /> : <Send size={16} className="mr-2" />}
                    {publishButtonText}
                </button>
            </div>
        </form>
    );
} 