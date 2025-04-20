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
                        title="Negrito (Ctrl+B)"
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
                        title="Itálico (Ctrl+I)"
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
                        title="Sublinhado (Ctrl+U)"
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
                            editor
                                .chain()
                                .focus()
                                .setTextAlign("left")
                                .run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "left" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Alinhar à Esquerda"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-align-left"></i>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign("center")
                                .run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "center" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Alinhar ao Centro"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-align-center"></i>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign("right")
                                .run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "right" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Alinhar à Direita"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-align-right"></i>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign("justify")
                                .run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive({ textAlign: "justify" })
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Justificar"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-align-justify"></i>
                    </button>
                </div>

                <div className="flex items-center space-x-1 mr-2">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("blockquote")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Citação"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-double-quotes-l"></i>
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().setHorizontalRule().run()
                        }
                        className="h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-200 text-gray-700"
                        title="Linha Horizontal"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-separator"></i>
                    </button>
                </div>

                <div className="flex items-center space-x-1 mr-2 relative">
                    <button
                        type="button"
                        onClick={() => setShowLinkMenu(!showLinkMenu)}
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            editor.isActive("link")
                                ? "bg-[#484DB5]/10 text-[#484DB5]"
                                : "hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Adicionar Link"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-link"></i>
                    </button>
                    {showLinkMenu && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded shadow-lg z-10 w-64">
                            <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="URL do link"
                                className="w-full p-1 border border-gray-300 rounded text-sm mb-1"
                            />
                            <div className="flex justify-end space-x-1">
                                <button
                                    onClick={addLink}
                                    className="px-2 py-0.5 bg-[#484DB5] text-white text-xs rounded hover:bg-[#373a8a]"
                                >
                                    Aplicar
                                </button>
                                {editor.isActive("link") && (
                                    <button
                                        onClick={removeLink}
                                        className="px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowImageMenu(!showImageMenu)}
                        className="h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-200 text-gray-700"
                        title="Adicionar Imagem"
                        disabled={viewMode === "preview"}
                    >
                        <i className="ri-image-add-line"></i>
                    </button>
                    {showImageMenu && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded shadow-lg z-10 w-64">
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="URL da imagem"
                                className="w-full p-1 border border-gray-300 rounded text-sm mb-1"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={addImage}
                                    className="px-2 py-0.5 bg-[#484DB5] text-white text-xs rounded hover:bg-[#373a8a]"
                                >
                                    Inserir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                 {/* Controles de Modo de Visualização e Ortografia */}
                <div className="flex items-center space-x-1 ml-auto">
                    {/* Alternar modos de visualização */}
                    <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                            type="button"
                            onClick={() => toggleViewMode("edit")}
                            className={`px-3 py-1.5 rounded-l-md text-xs transition-colors ${
                                viewMode === "edit"
                                    ? "bg-[#484DB5] text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-100"
                            }`}
                            title="Modo Edição"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleViewMode("split")}
                            className={`px-3 py-1.5 text-xs transition-colors border-l border-r border-gray-300 ${
                                viewMode === "split"
                                    ? "bg-[#484DB5] text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-100"
                            }`}
                            title="Modo Dividido"
                        >
                            <Columns size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleViewMode("preview")}
                            className={`px-3 py-1.5 rounded-r-md text-xs transition-colors ${
                                viewMode === "preview"
                                    ? "bg-[#484DB5] text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-100"
                            }`}
                            title="Modo Visualização"
                        >
                            <Eye size={14} />
                        </button>
                    </div>
                    {/* Ativar/Desativar Verificação Ortográfica */}
                    <button
                        type="button"
                        onClick={() => setSpellCheck(!spellCheck)}
                        className={`h-8 w-8 flex items-center justify-center rounded-md text-sm transition-colors ml-2 ${spellCheck ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        title={spellCheck ? "Desativar verificação ortográfica" : "Ativar verificação ortográfica"}
                    >
                         <i className="ri-spell-check-line"></i>
                    </button>
                </div>
            </div>

            {/* Conteúdo do Editor/Preview */}
            <div className="relative overflow-auto min-h-[300px]" style={{ minHeight: "500px" }}>
                {/* Menu Flutuante (BubbleMenu) */}
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                    className="flex items-center space-x-1 p-1 bg-gray-800 text-white rounded shadow-lg"
                >
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-2 py-1 rounded text-xs ${editor.isActive("bold") ? "bg-gray-600" : "hover:bg-gray-700"}`}
                    >
                        Negrito
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-2 py-1 rounded text-xs ${editor.isActive("italic") ? "bg-gray-600" : "hover:bg-gray-700"}`}
                    >
                        Itálico
                    </button>
                     <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`px-2 py-1 rounded text-xs ${editor.isActive("underline") ? "bg-gray-600" : "hover:bg-gray-700"}`}
                    >
                        Sublinhado
                    </button>
                </BubbleMenu>

                {/* Renderização condicional dos painéis */}
                {viewMode === "edit" && renderEditor()}
                {viewMode === "preview" && renderPreview()}
                {viewMode === "split" && (
                    <div className="flex h-full">
                        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                            {renderEditor()}
                        </div>
                        <div className="w-1/2 overflow-y-auto p-4">
                            {renderPreview()}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Rodapé com Contador de Palavras/Tempo de Leitura */}
            <div className="flex items-center justify-end p-2 border-t border-[#E5E7EB] bg-gray-50 text-xs text-gray-500">
                <span>{countWords(editor.getHTML()).toLocaleString('pt-BR')} palavras</span>
                <span className="mx-2">|</span>
                <span>~{estimateReadingTime(countWords(editor.getHTML()))} min de leitura</span>
            </div>
        </div>
    );
} 