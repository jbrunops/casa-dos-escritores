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
                        class: "paragraph",
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: "", // Permite adicionar classes personalizadas
                    },
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "is-editor-empty",
            }),
            Typography,
            TextAlign.configure({
                types: ["heading", "paragraph", "blockquote"],
            }),
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    rel: "noopener noreferrer",
                    class: "text-link",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "editor-image",
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
                class: "prose prose-lg max-w-none focus:outline-none font-sans p-4",
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
            <div className="editor-content medium-content">
                <EditorContent editor={editor} spellCheck={spellCheck} />
            </div>
        );
    };

    // Renderização da visualização prévia
    const renderPreview = () => {
        return (
            <div
                className="preview-content medium-story story-content prose medium-content"
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
        <div className="w-full border border-[#E5E7EB] rounded-md overflow-hidden bg-white">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#E5E7EB] bg-gray-50">
                <div className="flex items-center space-x-1 mr-2">
                    <button
                        type="button"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("heading", { level: 1 })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Título 1"
                        disabled={viewMode === "preview"}
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("heading", { level: 2 })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Título 2"
                        disabled={viewMode === "preview"}
                    >
                        H2
                    </button>
                </div>

                <div className="flex items-center space-x-1 mr-2">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("bold")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Negrito"
                        disabled={viewMode === "preview"}
                    >
                        <span className="font-bold">B</span>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("italic")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Itálico"
                        disabled={viewMode === "preview"}
                    >
                        <span className="italic">I</span>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("underline")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Sublinhado"
                        disabled={viewMode === "preview"}
                    >
                        <span className="underline">U</span>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("strike")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Tachado"
                        disabled={viewMode === "preview"}
                    >
                        <span className="line-through">S</span>
                    </button>
                </div>

                <div className="flex items-center space-x-1 mr-2">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("bulletList")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Lista com marcadores"
                        disabled={viewMode === "preview"}
                    >
                        • Lista
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("orderedList")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Lista numerada"
                        disabled={viewMode === "preview"}
                    >
                        1. Lista
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("blockquote")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Citação"
                        disabled={viewMode === "preview"}
                    >
                        " Citação
                    </button>
                </div>

                <div className="flex items-center space-x-1 mr-2">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().setTextAlign("left").run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "left" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Alinhar à esquerda"
                        disabled={viewMode === "preview"}
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().setTextAlign("center").run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "center" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Centralizar"
                        disabled={viewMode === "preview"}
                    >
                        ↔
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().setTextAlign("right").run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "right" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Alinhar à direita"
                        disabled={viewMode === "preview"}
                    >
                        →
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().setTextAlign("justify").run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "justify" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Justificar"
                        disabled={viewMode === "preview"}
                    >
                        ↔↔
                    </button>
                </div>

                <div className="h-8 w-px bg-gray-300 mx-2"></div>

                <div className="flex items-center space-x-1 mr-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowLinkMenu(!showLinkMenu)}
                            className={`h-10 px-3 rounded-md text-sm font-medium transition-colors flex items-center ${
                                editor.isActive("link")
                                    ? "bg-[#484DB5]/10 text-[#484DB5]"
                                    : "hover:bg-gray-200 text-gray-700"
                            }`}
                            title="Adicionar link"
                            disabled={viewMode === "preview"}
                        >
                            🔗 Link
                        </button>
                        {showLinkMenu && (
                            <div className="absolute left-0 top-full mt-1 p-2 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-10 w-64">
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        placeholder="https://exemplo.com"
                                        value={linkUrl}
                                        onChange={(e) =>
                                            setLinkUrl(e.target.value)
                                        }
                                        className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-transparent transition-all"
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={addLink}
                                            className="h-10 px-3 bg-[#484DB5] text-white rounded-md hover:bg-[#3b40a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-grow"
                                            disabled={!linkUrl}
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowLinkMenu(false)
                                            }
                                            className="h-10 px-3 border border-[#E5E7EB] text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
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
                            className="h-10 px-3 rounded-md text-sm font-medium hover:bg-gray-200 text-gray-700 transition-colors"
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
                            className="h-10 px-3 rounded-md text-sm font-medium hover:bg-gray-200 text-gray-700 transition-colors flex items-center"
                            title="Adicionar imagem"
                            disabled={viewMode === "preview"}
                        >
                            🖼️ Imagem
                        </button>
                        {showImageMenu && (
                            <div className="absolute left-0 top-full mt-1 p-2 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-10 w-64">
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/imagem.jpg"
                                        value={imageUrl}
                                        onChange={(e) =>
                                            setImageUrl(e.target.value)
                                        }
                                        className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-transparent transition-all"
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={addImage}
                                            className="h-10 px-3 bg-[#484DB5] text-white rounded-md hover:bg-[#3b40a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-grow"
                                            disabled={!imageUrl}
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowImageMenu(false)
                                            }
                                            className="h-10 px-3 border border-[#E5E7EB] text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-8 w-px bg-gray-300 mx-2"></div>
                
                <div className="flex items-center space-x-1 mr-2">
                    <button
                        type="button"
                        onClick={() => setSpellCheck(!spellCheck)}
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors flex items-center ${
                            spellCheck
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title={
                            spellCheck
                                ? "Desativar verificação ortográfica"
                                : "Ativar verificação ortográfica"
                        }
                        disabled={viewMode === "preview"}
                    >
                        <span>ABC</span>
                        <span className={`ml-1 ${spellCheck ? "text-green-600" : "text-gray-400"}`}>
                            ✓
                        </span>
                    </button>
                </div>

                <div className="h-8 w-px bg-gray-300 mx-2"></div>

                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => toggleViewMode("edit")}
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                            viewMode === "edit"
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Modo de edição"
                    >
                        <Edit2 size={16} />
                        <span>Editar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleViewMode("preview")}
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                            viewMode === "preview"
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Visualização prévia"
                    >
                        <Eye size={16} />
                        <span>Visualizar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleViewMode("split")}
                        className={`h-10 px-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                            viewMode === "split"
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Visualização dividida"
                    >
                        <Columns size={16} />
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
                    className="flex items-center bg-white border border-[#E5E7EB] rounded-md shadow-md p-1 z-50"
                >
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded ${
                            editor.isActive("bold") ? "bg-[#484DB5]/10 text-[#484DB5]" : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        <span className="font-bold">B</span>
                    </button>
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded ${
                            editor.isActive("italic") ? "bg-[#484DB5]/10 text-[#484DB5]" : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        <span className="italic">I</span>
                    </button>
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded ${
                            editor.isActive("underline") ? "bg-[#484DB5]/10 text-[#484DB5]" : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        <span className="underline">U</span>
                    </button>
                    <button
                        onClick={() => {
                            const url = window.prompt("Digite a URL do link:");
                            if (url) {
                                editor
                                    .chain()
                                    .focus()
                                    .extendMarkRange("link")
                                    .setLink({ href: url })
                                    .run();
                            }
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded ${
                            editor.isActive("link") ? "bg-[#484DB5]/10 text-[#484DB5]" : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        🔗
                    </button>
                </BubbleMenu>
            )}

            <div className={`w-full ${viewMode === "split" ? "flex" : ""}`}>
                {(viewMode === "edit" || viewMode === "split") && (
                    <div
                        className={`${
                            viewMode === "split" ? "w-1/2 border-r border-[#E5E7EB]" : "w-full"
                        }`}
                    >
                        <div className="min-h-[300px]">
                            <EditorContent editor={editor} spellCheck={spellCheck} className="h-full" />
                        </div>
                    </div>
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                    <div
                        className={`${
                            viewMode === "split" ? "w-1/2" : "w-full"
                        }`}
                    >
                        <div 
                            className="min-h-[300px] p-4 prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
