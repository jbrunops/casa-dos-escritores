"use client";

import React from 'react';
import {
    Image, // Para preview da capa e ícone de placeholder
    Save,  // Para botão de salvar/atualizar
    // Trash2 // Exclusão de séries não está implementada neste editor diretamente por enquanto
} from "lucide-react";

// Componentes e hooks específicos para SeriesEditor serão importados aqui
// ex: import useTagManagement from '@/hooks/useTagManagement';
// ex: import useFileUpload from '@/hooks/useFileUpload';

export default function SeriesEditor(props) {
    const {
        // Props de estado e setters (do ContentEditor)
        currentTitle, setCurrentTitle,
        currentDescription, setCurrentDescription,
        currentCategory, setCurrentCategory, // Usado como Gênero para séries
        tags, setTags,
        tagInput, setTagInput,
        coverFile, setCoverFile,  
        coverPreview, setCoverPreview,  
        
        // Props de controle de UI e ações (do ContentEditor)
        categories, // Lista de todas as categorias (usada para Gênero)
        handleSubmit, // (event, isDraft - isDraft pode não ser relevante para series)
        // handleDelete, // Exclusão de série pode ter uma lógica diferente ou não estar aqui
        handleAddTag, 
        handleRemoveTag, 
        handleCoverChange,
        saving, 
        publishing, 
        isDeleting, // Pode não ser usado diretamente aqui se não houver botão de excluir
        formTouched,
        isEditingMode, // boolean: true se estiver editando, false se criando
        // showDeleteModal, setShowDeleteModal, // Se for adicionar exclusão

        // Outras props
        requireCategory = true, // Default para séries (Gênero)
        type // Deveria ser "series"
    } = props;

    // Lógica para texto e ícone dos botões
    const submitButtonText = isEditingMode ? "Atualizar Série" : "Publicar Série";
    // Para séries, geralmente não há "rascunho" da mesma forma que histórias/capítulos,
    // então teremos apenas um botão principal de submissão.

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Seção de título e gênero */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="series-title" className="block text-sm font-medium text-gray-700">
                        Título da Série*
                    </label>
                    <input
                        id="series-title"
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                        placeholder="Um título marcante para sua série..."
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="series-genre" className="block text-sm font-medium text-gray-700">
                        Gênero
                        {requireCategory && "*"}
                    </label>
                    <select
                        id="series-genre"
                        value={currentCategory} // Reutilizando currentCategory para gênero
                        onChange={(e) => setCurrentCategory(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                        required={requireCategory}
                    >
                        <option value="">Selecione um gênero</option>
                        {categories && categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Descrição da Série */}
            <div className="space-y-2">
                <label htmlFor="series-description" className="block text-sm font-medium text-gray-700">
                    Descrição da Série
                </label>
                <textarea
                    id="series-description"
                    value={currentDescription}
                    onChange={(e) => setCurrentDescription(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                    placeholder="Descreva sua série em alguns parágrafos..."
                />
            </div>

            {/* Tags */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Tags (até 5)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags && tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#484DB5]/10 text-[#484DB5]"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)} // handleRemoveTag vem das props
                                className="ml-2 text-[#484DB5] hover:text-opacity-70"
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)} // setTagInput vem das props
                    onKeyDown={handleAddTag} // handleAddTag vem das props
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                    placeholder="Digite uma tag e pressione Enter"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Digite uma tag e pressione Enter para adicionar. Máximo de 5 tags.
                </p>
            </div>

            {/* Imagem de Capa */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Imagem de Capa
                </label>
                <div className="flex items-center space-x-4">
                    <div className="relative w-40 h-40 border-2 border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center overflow-hidden">
                        {coverPreview ? (
                            <img
                                src={coverPreview} // coverPreview vem das props
                                alt="Preview da Capa"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center p-4 flex flex-col items-center">
                                <Image
                                    size={32}
                                    className="text-gray-400 mb-2"
                                />
                                <span className="text-sm text-gray-500">
                                    Prévia da imagem
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            type="file"
                            id="series-cover"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleCoverChange} // handleCoverChange vem das props
                            className="hidden"
                        />
                        <label
                            htmlFor="series-cover"
                            className="h-10 px-4 inline-flex items-center cursor-pointer bg-white border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                        >
                            Selecionar imagem
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG ou GIF. Tamanho máximo de 2MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-8 pt-6 border-t border-gray-200">
                {/* Para séries, não há botão de "Salvar Rascunho" separado, apenas um de submissão principal */}
                {/* O botão de Excluir para séries pode ser adicionado futuramente se necessário, 
                    mas a lógica de exclusão de série (com seus capítulos) é mais complexa 
                    e não estava no ContentEditor original para séries.
                */}
                <button
                    type="submit" // Publicar/Atualizar Série
                    disabled={saving || publishing || isDeleting || !formTouched} 
                    className="w-full sm:w-auto h-10 px-6 inline-flex items-center justify-center gap-2 bg-[#484DB5] text-white rounded-md hover:bg-[#484DB5]/90 focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={16} className="mr-2" /> {/* Ícone de Save para criar ou atualizar */}
                    {submitButtonText}
                </button>
            </div>
        </form>
    );
} 