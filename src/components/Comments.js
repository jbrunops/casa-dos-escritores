// src/components/Comments.js
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

        // Configurar subscription para atualizações em tempo real
        const subscription = supabase
            .channel("comments_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "comments",
                    filter: `story_id=eq.${storyId}`,
                },
                () => {
                    loadComments();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [storyId, sessionId]);

    // Se estamos respondendo a um comentário, focar no input
    useEffect(() => {
        if (replyTo && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [replyTo]);

    // Função para carregar comentários de forma confiável
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

            // Organizar comentários em uma estrutura hierárquica
            const commentMap = {};
            const rootComments = [];

            // Primeiro, mapear todos os comentários por ID
            data.forEach((comment) => {
                commentMap[comment.id] = {
                    ...comment,
                    replies: [],
                };
            });

            // Em seguida, construir a hierarquia
            data.forEach((comment) => {
                if (comment.parent_id) {
                    // Se tem parent_id, é uma resposta
                    if (commentMap[comment.parent_id]) {
                        commentMap[comment.parent_id].replies.push(
                            commentMap[comment.id]
                        );
                    } else {
                        // Se o pai não existir (por algum motivo), tratar como comentário raiz
                        rootComments.push(commentMap[comment.id]);
                    }
                } else {
                    // Se não tem parent_id, é um comentário raiz
                    rootComments.push(commentMap[comment.id]);
                }
            });

            setComments(rootComments);
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
            const commentData = {
                text: newComment,
                story_id: storyId,
                author_id: sessionId,
                parent_id: replyTo ? replyTo.id : null,
            };

            const { data: comment, error: insertError } = await supabase
                .from("comments")
                .insert([commentData])
                .select();

            if (insertError) {
                console.error("Erro ao inserir comentário:", insertError);
                throw insertError;
            }

            // Criar notificação para o autor da história (se não for o próprio comentarista)
            if (authorId && authorId !== sessionId) {
                await createNotification({
                    user_id: authorId,
                    type: "comment",
                    content: `${username} comentou em sua história.`,
                    related_id: storyId,
                    sender_id: sessionId,
                    additional_data: {
                        story_id: storyId,
                        comment_id: comment[0].id,
                    },
                });
            }

            // Se for uma resposta, notificar o autor do comentário original
            if (replyTo && replyTo.author_id !== sessionId) {
                await createNotification({
                    user_id: replyTo.author_id,
                    type: "reply",
                    content: `${username} respondeu ao seu comentário.`,
                    related_id: storyId,
                    sender_id: sessionId,
                    additional_data: {
                        story_id: storyId,
                        comment_id: comment[0].id,
                        parent_comment_id: replyTo.id,
                    },
                });
            }

            setNewComment("");
            setSuccess(true);
            setReplyTo(null);
            await loadComments();

            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            console.error("Erro ao publicar comentário:", err);
            setError(
                "Não foi possível enviar seu comentário. Por favor, tente novamente."
            );
        } finally {
            setSubmitting(false);
        }
    }

    // Função para criar notificações
    async function createNotification(notificationData) {
        try {
            const { error } = await supabase
                .from("notifications")
                .insert([notificationData]);

            if (error) {
                console.error("Erro ao criar notificação:", error);
            }
        } catch (error) {
            console.error("Exceção ao criar notificação:", error);
        }
    }

    // Função para iniciar uma resposta a um comentário
    const handleReply = (comment) => {
        setReplyTo(comment);
        setNewComment(`@${comment.profiles.username} `);
    };

    // Função para cancelar a resposta
    const cancelReply = () => {
        setReplyTo(null);
        setNewComment("");
    };

    // Renderizar comentário e suas respostas recursivamente
    const renderComment = (comment, level = 0) => {
        return (
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
    };

    return (
        <div className="comments-section">
            <h3>
                <span className="comment-icon-container mr-1">
                    <MessageSquare size={20} />
                </span>
                Comentários (
                {comments.reduce(
                    (count, comment) =>
                        count +
                        1 +
                        (comment.replies ? comment.replies.length : 0),
                    0
                )}
                )
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
                                Respondendo para {replyTo.profiles.username}
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
                    comments.map((comment) => renderComment(comment))
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
