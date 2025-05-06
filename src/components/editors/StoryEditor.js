"use client";

import React from 'react';
import TipTapEditor from "@/components/TipTapEditor";
import {
    FileText,
    BookOpen,
    Clock,
    Save, // Para botão de salvar rascunho
    Send, // Para botão de publicar
    Trash2 // Para botão de excluir
} from "lucide-react";

// Componentes e hooks específicos para StoryEditor serão importados aqui
// ex: import TipTapEditor from '@/components/TipTapEditor';
// ex: import useTextStats from '@/hooks/useTextStats';

export default function StoryEditor(props) {
    const {
        // Props de estado e setters (ainda gerenciadas pelo ContentEditor)
        currentTitle, setCurrentTitle,
        currentContent, setCurrentContent,
        currentCategory, setCurrentCategory,
        
        // Props de controle de UI e ações (do ContentEditor)
        categories, // lista de todas as categorias
        handleSubmit, // (event, isDraft) => void
        handleDelete, // () => void
        // getSubmitButtonText, // Será substituído por lógica local ou props mais diretas
        // getSubmitButtonIcon, // Será substituído
        // getPublishButtonText, // Será substituído
        // getPublishButtonIcon, // Será substituído
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

        // Outras props que podem ser úteis ou passadas (do ContentEditor)
        // backPath, backLabel, headerTitle - estes são mais para o layout geral em ContentEditor
        requireCategory = true, // Default para story
        type // Deveria ser "story"
    } = props;

    // Lógica para texto e ícone dos botões, agora local ou simplificada
    const saveDraftButtonText = isEditingMode ? "Atualizar Rascunho" : "Salvar Rascunho";
    const publishButtonText = isEditingMode ? "Atualizar História" : "Publicar História";

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Seção de título e categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="story-title" className="block text-sm font-medium text-gray-700">
                        Título da História*
                    </label>
                    <input
                        id="story-title"
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                        placeholder="Um título cativante para sua história..."
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="story-category" className="block text-sm font-medium text-gray-700">
                        Categoria
                        {requireCategory && "*"}
                    </label>
                    <select
                        id="story-category"
                        value={currentCategory}
                        onChange={(e) => setCurrentCategory(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                        required={requireCategory}
                    >
                        <option value="">Selecione uma categoria</option>
                        {categories && categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Editor de conteúdo */}
            <div className="space-y-2">
                <label htmlFor="story-content" className="block text-sm font-medium text-gray-700">
                    Conteúdo*
                </label>
                <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
                    <TipTapEditor
                        value={currentContent}
                        onChange={setCurrentContent} // Passando diretamente o setter do ContentEditor
                        placeholder="Comece a escrever sua história aqui... Deixe sua imaginação fluir!"
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
                        Excluir História
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