// src/components/TipTapEditor.js
"use client";

import { useEditor, EditorContent, BubbleMenu, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState, useCallback, useEffect } from "react";
import { Eye, Edit2, Columns } from "lucide-react";

export default function TipTapEditor({
    value,
    content,
    onChange,
    placeholder = "Comece a escrever sua história aqui...",
}) {
    // Usar qualquer um dos valores fornecidos (content tem precedência sobre value para compatibilidade)
    const initialContent = content || value || "";
    
    const [linkUrl, setLinkUrl] = useState("");
    const [showLinkMenu, setShowLinkMenu] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [showImageMenu, setShowImageMenu] = useState(false);
    const [viewMode, setViewMode] = useState("edit"); // edit, preview, split
    const [spellCheck, setSpellCheck] = useState(true);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: {
                    HTMLAttributes: {
                        class: "my-4",
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: "border-l-4 border-gray-300 pl-4 italic my-4",
                    },
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none",
            }),
            Typography,
            TextAlign.configure({
                types: ["heading", "paragraph", "blockquote"],
            }),
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    rel: "noopener noreferrer",
                    class: "text-purple-600 underline hover:text-purple-800",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-md my-4",
                },
            }),
            // Nova extensão para suporte a atributos personalizados em blockquote
            Extension.create({
                name: "wordCount",
                addGlobalAttributes() {
                    return [
                        {
                            types: ["blockquote"],
                            attributes: {
                                class: {
                                    default: null,
                                },
                            },
                        },
                    ];
                },
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: "prose max-w-none focus:outline-none font-sans p-4",
            },
        },
    });

    // Atualizar o conteúdo do editor quando ele mudar externamente
    useEffect(() => {
        if (!editor) return;
        
        // Use o conteúdo atualizado a partir das props
        const newContent = content || value || "";
        
        // Apenas atualizar se o conteúdo realmente mudou e o editor já estiver pronto
        const currentContent = editor.getHTML();
        
        // Compara se o conteúdo é diferente, mas evita ciclos infinitos
        if (newContent && newContent !== currentContent) {
            // Defina o cursor para o início do documento e atualize o conteúdo
            editor.commands.setContent(newContent, false);
        }
    }, [editor, content, value]);

    // Desfazer o editor quando o componente for desmontado
    useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, [editor]);

    const addLink = useCallback(() => {
        if (!linkUrl) return;

        // Executa o comando para adicionar o link
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: linkUrl })
            .run();

        // Limpa o campo e fecha o menu
        setLinkUrl("");
        setShowLinkMenu(false);
    }, [editor, linkUrl]);

    const removeLink = useCallback(() => {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }, [editor]);

    const addImage = useCallback(() => {
        if (!imageUrl) return;

        // Adiciona a imagem no ponto do cursor
        editor.chain().focus().setImage({ src: imageUrl }).run();

        // Limpa o campo e fecha o menu
        setImageUrl("");
        setShowImageMenu(false);
    }, [editor, imageUrl]);

    if (!editor) {
        return null;
    }

    // Alternar entre os modos: edição, visualização e dividido
    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    // Renderização do editor com base no modo selecionado
    const renderEditor = () => {
        return (
            <div className="w-full h-full bg-white">
                <EditorContent editor={editor} spellCheck={spellCheck} />
            </div>
        );
    };

    // Renderização da visualização prévia
    const renderPreview = () => {
        return (
            <div
                className="w-full h-full p-4 bg-white prose max-w-none overflow-auto"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
        );
    };

    // Funções para contador de palavras e tempo de leitura
    const countWords = (text) => {
        // Remove tags HTML e caracteres especiais
        const plainText = text
            .replace(/<[^>]*>/g, " ")
            .replace(/[^\w\s]/g, " ");
        // Divide por espaços e filtra palavras vazias
        const words = plainText.split(/\s+/).filter((word) => word.length > 0);
        return words.length;
    };

    const estimateReadingTime = (wordCount) => {
        // Média de 200 palavras por minuto
        const minutes = Math.ceil(wordCount / 200);
        return minutes;
    };

    return (
        <div className="w-full border border-gray-200 rounded-md shadow-sm bg-white">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-1 mr-3 border-r border-gray-200 pr-3">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("bold") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Negrito"
                        disabled={viewMode === "preview"}
                    >
                        <span className="font-bold">B</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("italic") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Itálico"
                        disabled={viewMode === "preview"}
                    >
                        <span className="italic">I</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("underline") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Sublinhado"
                        disabled={viewMode === "preview"}
                    >
                        <span className="underline">U</span>
                    </button>
                </div>

                <div className="flex space-x-1 mr-3 border-r border-gray-200 pr-3">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("heading", { level: 1 }) ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Título 1"
                        disabled={viewMode === "preview"}
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("heading", { level: 2 }) ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Título 2"
                        disabled={viewMode === "preview"}
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("heading", { level: 3 }) ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Título 3"
                        disabled={viewMode === "preview"}
                    >
                        H3
                    </button>
                </div>

                <div className="flex space-x-1 mr-3 border-r border-gray-200 pr-3">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("bulletList") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Lista com marcadores"
                        disabled={viewMode === "preview"}
                    >
                        • Lista
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("orderedList") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Lista numerada"
                        disabled={viewMode === "preview"}
                    >
                        1. Lista
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive("blockquote") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Citação"
                        disabled={viewMode === "preview"}
                    >
                        " Citação
                    </button>
                </div>

                <div className="flex space-x-1 mr-3 border-r border-gray-200 pr-3">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive({ textAlign: "left" }) ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Alinhar à esquerda"
                        disabled={viewMode === "preview"}
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive({ textAlign: "center" }) ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Centralizar"
                        disabled={viewMode === "preview"}
                    >
                        ↔
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                            editor.isActive({ textAlign: "right" }) ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title="Alinhar à direita"
                        disabled={viewMode === "preview"}
                    >
                        →
                    </button>
                </div>

                <div className="flex space-x-1 mr-3 border-r border-gray-200 pr-3">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowLinkMenu(!showLinkMenu)}
                            className={`p-2 rounded hover:bg-gray-200 transition-colors flex items-center ${
                                editor.isActive("link") ? "bg-gray-200 text-purple-600" : "text-gray-700"
                            }`}
                            title="Adicionar link"
                            disabled={viewMode === "preview"}
                        >
                            🔗 Link
                        </button>
                        {showLinkMenu && (
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-10 p-3">
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        placeholder="https://exemplo.com"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                    <div className="flex justify-between space-x-2">
                                        <button
                                            type="button"
                                            onClick={addLink}
                                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            disabled={!linkUrl}
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowLinkMenu(false)}
                                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {editor.isActive("link") && (
                        <button
                            type="button"
                            onClick={removeLink}
                            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                            title="Remover link"
                            disabled={viewMode === "preview"}
                        >
                            🔗❌
                        </button>
                    )}

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowImageMenu(!showImageMenu)}
                            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 flex items-center"
                            title="Adicionar imagem"
                            disabled={viewMode === "preview"}
                        >
                            🖼️ Imagem
                        </button>
                        {showImageMenu && (
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-10 p-3">
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/imagem.jpg"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                    <div className="flex justify-between space-x-2">
                                        <button
                                            type="button"
                                            onClick={addImage}
                                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            disabled={!imageUrl}
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowImageMenu(false)}
                                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex space-x-1 mr-3 border-r border-gray-200 pr-3">
                    <button
                        type="button"
                        onClick={() => setSpellCheck(!spellCheck)}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors flex items-center ${
                            spellCheck ? "bg-gray-200 text-purple-600" : "text-gray-700"
                        }`}
                        title={spellCheck ? "Desativar verificação ortográfica" : "Ativar verificação ortográfica"}
                        disabled={viewMode === "preview"}
                    >
                        <span>ABC</span>
                        <span className={spellCheck ? "text-green-500 ml-1" : "text-gray-400 ml-1"}>
                            ✓
                        </span>
                    </button>
                </div>

                <div className="flex ml-auto">
                    <button
                        type="button"
                        onClick={() => toggleViewMode("edit")}
                        className={`flex items-center p-2 rounded ${
                            viewMode === "edit" 
                            ? "bg-purple-100 text-purple-700" 
                            : "text-gray-700 hover:bg-gray-200"
                        } transition-colors mr-1`}
                        title="Modo de edição"
                    >
                        <Edit2 size={16} className="mr-1" />
                        <span>Editar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleViewMode("preview")}
                        className={`flex items-center p-2 rounded ${
                            viewMode === "preview" 
                            ? "bg-purple-100 text-purple-700" 
                            : "text-gray-700 hover:bg-gray-200"
                        } transition-colors mr-1`}
                        title="Visualização prévia"
                    >
                        <Eye size={16} className="mr-1" />
                        <span>Visualizar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleViewMode("split")}
                        className={`flex items-center p-2 rounded ${
                            viewMode === "split" 
                            ? "bg-purple-100 text-purple-700" 
                            : "text-gray-700 hover:bg-gray-200"
                        } transition-colors`}
                        title="Visualização dividida"
                    >
                        <Columns size={16} className="mr-1" />
                        <span>Dividido</span>
                    </button>
                </div>
            </div>

            {editor && (
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                    shouldShow={({
                        editor,
                        view,
                        state,
                        oldState,
                        from,
                        to,
                    }) => {
                        // Exibir o menu de bolha apenas quando texto for selecionado e estiver no modo de edição
                        return from !== to && viewMode !== "preview";
                    }}
                    className="flex bg-white rounded shadow-md border border-gray-200 overflow-hidden"
                >
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={`p-1.5 ${
                            editor.isActive("bold") ? "bg-gray-100 text-purple-600" : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        <span className="font-bold">B</span>
                    </button>
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={`p-1.5 ${
                            editor.isActive("italic") ? "bg-gray-100 text-purple-600" : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        <span className="italic">I</span>
                    </button>
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                        className={`p-1.5 ${
                            editor.isActive("underline") ? "bg-gray-100 text-purple-600" : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        <span className="underline">U</span>
                    </button>
                </BubbleMenu>
            )}

            <div className={`${viewMode === "split" ? "flex border-t border-gray-200" : ""}`}>
                {(viewMode === "edit" || viewMode === "split") && (
                    <div
                        className={`${
                            viewMode === "split" ? "w-1/2 border-r border-gray-200" : "w-full"
                        }`}
                    >
                        {renderEditor()}
                    </div>
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                    <div
                        className={`${
                            viewMode === "split" ? "w-1/2" : "w-full"
                        }`}
                    >
                        {renderPreview()}
                    </div>
                )}
            </div>

            <div className="flex justify-end items-center px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex space-x-4">
                    <span title="Contagem de palavras">
                        {countWords(editor.getHTML())} palavras
                    </span>
                    <span title="Tempo estimado de leitura">
                        {estimateReadingTime(countWords(editor.getHTML()))} min de leitura
                    </span>
                </div>
            </div>
        </div>
    );
}
