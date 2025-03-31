"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { RefreshCw, MessageSquare, Reply, X } from "lucide-react";

export default function Comments({ storyId, sessionId, authorId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const supabase = createBrowserClient();
    const commentInputRef = useRef(null);

    useEffect(() => {
        // Carregar comentários iniciais
        loadComments();

        if (sessionId) {
            fetchUsername();
        }
    }, [storyId, sessionId]);

    // Se estamos respondendo a um comentário, focar no input
    useEffect(() => {
        if (replyTo && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [replyTo]);

    // Função para carregar comentários
    const loadComments = async () => {
        try {
            if (!storyId) {
                console.error("storyId é inválido:", storyId);
                return;
            }

            const { data, error } = await supabase
                .from("comments")
                .select(
                    `
                    id, 
                    text,
                    created_at,
                    author_id,
                    parent_id,
                    profiles(username, avatar_url)
                `
                )
                .eq("story_id", storyId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Erro ao buscar comentários:", error);
                return;
            }

            setComments(data || []);
        } catch (err) {
            console.error("Exceção ao carregar comentários:", err);
            setComments([]);
        }
    };

    async function fetchUsername() {
        try {
            const { data } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", sessionId)
                .single();

            if (data) {
                setUsername(data.username);
            }
        } catch (err) {
            console.error("Erro ao buscar nome de usuário:", err);
        }
    }

    // Usar a API para adicionar comentários
    async function handleSubmitComment(e) {
        e.preventDefault();

        if (!sessionId) {
            setError("Você precisa estar logado para comentar");
            return;
        }

        if (!newComment.trim()) {
            setError("O comentário não pode estar vazio");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Verificar se storyId é válido
            if (!storyId) {
                console.error("storyId inválido:", storyId);
                throw new Error("ID da história inválido");
            }

            // Verificar se sessionId é válido
            if (!sessionId) {
                console.error("sessionId inválido:", sessionId);
                throw new Error("ID do usuário inválido");
            }

            // Preparar dados para a API
            const commentData = {
                text: newComment,
                storyId: storyId,
                authorId: sessionId,
                parentId: replyTo ? replyTo.id : null,
            };

            console.log("Enviando para API:", commentData);

            // Fazer requisição para a API
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(commentData),
            });

            const result = await response.json();
            console.log("Resposta da API:", result);

            if (!response.ok) {
                const errorMessage =
                    result.error || "Erro ao adicionar comentário";
                const errorDetails = result.details
                    ? JSON.stringify(result.details)
                    : "";
                throw new Error(`${errorMessage} ${errorDetails}`);
            }

            // Sucesso!
            setNewComment("");
            setReplyTo(null);
            setSuccess(true);

            // Recarregar comentários
            await loadComments();

            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            console.error("Erro detalhado:", err);
            setError(`Erro: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    }

    // Função para iniciar uma resposta a um comentário
    const handleReply = (comment) => {
        setReplyTo(comment);
        setNewComment(`@${comment.profiles?.username || "Usuário"} `);
    };

    // Cancelar resposta
    const cancelReply = () => {
        setReplyTo(null);
        setNewComment("");
    };

    // Renderizar comentários hierarquicamente
    const renderComments = () => {
        // Agrupar comentários por hierarquia
        const commentMap = {};
        const rootComments = [];

        // Mapear todos os comentários por ID
        comments.forEach((comment) => {
            const commentWithReplies = { ...comment, replies: [] };
            commentMap[comment.id] = commentWithReplies;

            if (!comment.parent_id) {
                rootComments.push(commentWithReplies);
            }
        });

        // Adicionar respostas aos pais
        comments.forEach((comment) => {
            if (comment.parent_id && commentMap[comment.parent_id]) {
                commentMap[comment.parent_id].replies.push(
                    commentMap[comment.id]
                );
            }
        });

        // Renderizar recursivamente
        const renderComment = (comment, level = 0) => (
            <div
                key={comment.id}
                className={`comment-container ${
                    level > 0 ? "nested-comment" : ""
                }`}
            >
                <div
                    className="comment"
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    <div className="comment-header">
                        <div className="comment-author-info">
                            {comment.profiles?.avatar_url ? (
                                <img
                                    src={comment.profiles.avatar_url}
                                    alt={
                                        comment.profiles?.username || "Usuário"
                                    }
                                    className="comment-avatar"
                                />
                            ) : (
                                <div className="comment-avatar-placeholder">
                                    {(comment.profiles?.username || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}
                            <span className="comment-author">
                                {comment.profiles?.username || "Usuário"}
                            </span>
                        </div>
                        <span className="comment-date">
                            {new Date(comment.created_at).toLocaleDateString(
                                "pt-BR"
                            )}
                        </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    {sessionId && (
                        <div className="comment-actions">
                            <button
                                onClick={() => handleReply(comment)}
                                className="reply-button"
                            >
                                <Reply size={16} />
                                <span>Responder</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Renderizar respostas recursivamente */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                        {comment.replies.map((reply) =>
                            renderComment(reply, level + 1)
                        )}
                    </div>
                )}
            </div>
        );

        return rootComments.map((comment) => renderComment(comment));
    };

    return (
        <div className="comments-section">
            <h3>
                <span className="comment-icon-container mr-1">
                    <MessageSquare size={20} />
                </span>
                Comentários ({comments.length})
            </h3>

            {sessionId ? (
                <form onSubmit={handleSubmitComment} className="comment-form">
                    {error && (
                        <div className="error-message comment-error">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="success-message">
                            Comentário publicado com sucesso!
                        </div>
                    )}

                    {replyTo && (
                        <div className="reply-indicator">
                            <span>
                                Respondendo para{" "}
                                {replyTo.profiles?.username || "Usuário"}
                            </span>
                            <button
                                type="button"
                                onClick={cancelReply}
                                className="cancel-reply-button"
                                title="Cancelar resposta"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreva seu comentário..."
                        disabled={submitting}
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="comment-submit-btn"
                    >
                        {submitting ? (
                            <>
                                <span className="loader"></span>
                                <span>Enviando...</span>
                            </>
                        ) : (
                            "Comentar"
                        )}
                    </button>
                </form>
            ) : (
                <p className="login-prompt">
                    <Link href="/login">Faça login</Link> para comentar
                </p>
            )}

            <div className="comments-list">
                {comments.length === 0 ? (
                    <p className="no-comments">
                        Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                ) : (
                    renderComments()
                )}
            </div>

            <button onClick={loadComments} className="reload-comments-btn">
                <span className="mr-1">
                    <RefreshCw size={16} />
                </span>
                Atualizar comentários
            </button>
        </div>
    );
}
