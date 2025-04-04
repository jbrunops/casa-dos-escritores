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
                class: "prose medium-style focus:outline-none font-poppins p-4",
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
        <div className="editor-container medium-style">
            <div className="editor-toolbar">
                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        className={`toolbar-button ${
                            editor.isActive("heading", { level: 1 })
                                ? "is-active"
                                : ""
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
                        className={`toolbar-button ${
                            editor.isActive("heading", { level: 2 })
                                ? "is-active"
                                : ""
                        }`}
                        title="Título 2"
                        disabled={viewMode === "preview"}
                    >
                        H2
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={`toolbar-button ${
                            editor.isActive("bold") ? "is-active" : ""
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
                        className={`toolbar-button ${
                            editor.isActive("italic") ? "is-active" : ""
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
                        className={`toolbar-button ${
                            editor.isActive("underline") ? "is-active" : ""
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
                        className={`toolbar-button ${
                            editor.isActive("strike") ? "is-active" : ""
                        }`}
                        title="Tachado"
                        disabled={viewMode === "preview"}
                    >
                        <span className="line-through">S</span>
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        className={`toolbar-button ${
                            editor.isActive("bulletList") ? "is-active" : ""
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
                        className={`toolbar-button ${
                            editor.isActive("orderedList") ? "is-active" : ""
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
                        className={`toolbar-button ${
                            editor.isActive("blockquote") ? "is-active" : ""
                        }`}
                        title="Citação"
                        disabled={viewMode === "preview"}
                    >
                        " Citação
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() =>
                            editor.chain().focus().setTextAlign("left").run()
                        }
                        className={`toolbar-button ${
                            editor.isActive({ textAlign: "left" })
                                ? "is-active"
                                : ""
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
                        className={`toolbar-button ${
                            editor.isActive({ textAlign: "center" })
                                ? "is-active"
                                : ""
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
                        className={`toolbar-button ${
                            editor.isActive({ textAlign: "right" })
                                ? "is-active"
                                : ""
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
                        className={`toolbar-button ${
                            editor.isActive({ textAlign: "justify" })
                                ? "is-active"
                                : ""
                        }`}
                        title="Justificar"
                        disabled={viewMode === "preview"}
                    >
                        ↔↔
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                    <div className="dropdown">
                        <button
                            type="button"
                            onClick={() => setShowLinkMenu(!showLinkMenu)}
                            className={`toolbar-button ${
                                editor.isActive("link") ? "is-active" : ""
                            }`}
                            title="Adicionar link"
                            disabled={viewMode === "preview"}
                        >
                            🔗 Link
                        </button>
                        {showLinkMenu && (
                            <div className="dropdown-menu">
                                <div className="link-menu">
                                    <input
                                        type="url"
                                        placeholder="https://exemplo.com"
                                        value={linkUrl}
                                        onChange={(e) =>
                                            setLinkUrl(e.target.value)
                                        }
                                        className="link-input"
                                    />
                                    <div className="link-buttons">
                                        <button
                                            type="button"
                                            onClick={addLink}
                                            className="link-button"
                                            disabled={!linkUrl}
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowLinkMenu(false)
                                            }
                                            className="link-button cancel"
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
                            className="toolbar-button"
                            title="Remover link"
                            disabled={viewMode === "preview"}
                        >
                            🔗❌
                        </button>
                    )}

                    <div className="dropdown">
                        <button
                            type="button"
                            onClick={() => setShowImageMenu(!showImageMenu)}
                            className="toolbar-button"
                            title="Adicionar imagem"
                            disabled={viewMode === "preview"}
                        >
                            🖼️ Imagem
                        </button>
                        {showImageMenu && (
                            <div className="dropdown-menu">
                                <div className="link-menu">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/imagem.jpg"
                                        value={imageUrl}
                                        onChange={(e) =>
                                            setImageUrl(e.target.value)
                                        }
                                        className="link-input"
                                    />
                                    <div className="link-buttons">
                                        <button
                                            type="button"
                                            onClick={addImage}
                                            className="link-button"
                                            disabled={!imageUrl}
                                        >
                                            Adicionar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowImageMenu(false)
                                            }
                                            className="link-button cancel"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botão para verificação ortográfica */}
                <div className="toolbar-divider"></div>
                <div className="toolbar-group">
                    <button
                        type="button"
                        onClick={() => setSpellCheck(!spellCheck)}
                        className={`toolbar-button ${
                            spellCheck ? "is-active" : ""
                        }`}
                        title={
                            spellCheck
                                ? "Desativar verificação ortográfica"
                                : "Ativar verificação ortográfica"
                        }
                        disabled={viewMode === "preview"}
                    >
                        <span>ABC</span>
                        <span
                            className={
                                spellCheck ? "check-active" : "check-inactive"
                            }
                        >
                            ✓
                        </span>
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Botões de modo de visualização */}
                <div className="view-mode-buttons">
                    <button
                        type="button"
                        onClick={() => toggleViewMode("edit")}
                        className={`view-mode-button ${
                            viewMode === "edit" ? "active" : ""
                        }`}
                        title="Modo de edição"
                    >
                        <Edit2 size={16} />
                        <span>Editar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleViewMode("preview")}
                        className={`view-mode-button ${
                            viewMode === "preview" ? "active" : ""
                        }`}
                        title="Visualização prévia"
                    >
                        <Eye size={16} />
                        <span>Visualizar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleViewMode("split")}
                        className={`view-mode-button ${
                            viewMode === "split" ? "active" : ""
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
                    className="bubble-menu"
                >
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        className={`bubble-button ${
                            editor.isActive("bold") ? "is-active" : ""
                        }`}
                    >
                        <span className="font-bold">B</span>
                    </button>
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        className={`bubble-button ${
                            editor.isActive("italic") ? "is-active" : ""
                        }`}
                    >
                        <span className="italic">I</span>
                    </button>
                    <button
                        onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                        }
                        className={`bubble-button ${
                            editor.isActive("underline") ? "is-active" : ""
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
                        className={`bubble-button ${
                            editor.isActive("link") ? "is-active" : ""
                        }`}
                    >
                        🔗
                    </button>
                </BubbleMenu>
            )}

            <div className={`editor-preview-container ${viewMode}`}>
                {(viewMode === "edit" || viewMode === "split") && (
                    <div
                        className={`editor-pane ${
                            viewMode === "split" ? "split" : ""
                        }`}
                    >
                        {renderEditor()}
                    </div>
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                    <div
                        className={`preview-pane ${
                            viewMode === "split" ? "split" : ""
                        }`}
                    >
                        {renderPreview()}
                    </div>
                )}
            </div>

            {/* Exibição de estatísticas do texto */}
            <div className="editor-stats">
                {/* Estatísticas são exibidas pelo componente pai */}
            </div>
        </div>
    );
}
