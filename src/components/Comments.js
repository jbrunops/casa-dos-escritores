"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { RefreshCw, MessageSquare, Reply, X } from "lucide-react";

export default function Comments({
    storyId,
    contentId,
    contentType,
    sessionId,
    userId,
    authorId,
    isSeriesComment = false,
}) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const supabase = createBrowserClient();
    const commentInputRef = useRef(null);
    const [userSession, setUserSession] = useState(null);

    // Determinar o ID e tipo de conteúdo para comentários
    const id = contentId || storyId;
    const type = contentType || (isSeriesComment ? "series" : "story");
    // Usar userId se fornecido, senão usar sessionId
    const currentUserId = userId || sessionId;
    
    // Se não temos userId do servidor, tentar buscar com supabase browser client
    useEffect(() => {
        async function getUserSession() {
            if (!currentUserId) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        setUserSession(session.user.id);
                        fetchUsername(session.user.id);
                    }
                } catch (err) {
                    console.error("Erro ao obter sessão:", err);
                }
            } else {
                fetchUsername(currentUserId);
            }
        }
        
        getUserSession();
    }, [currentUserId, supabase]);
    
    useEffect(() => {
        // Carregar comentários iniciais
        loadComments();
    }, [id]);

    // Se estamos respondendo a um comentário, focar no input
    useEffect(() => {
        if (replyTo && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [replyTo]);

    // Função para carregar comentários
    const loadComments = async () => {
        try {
            if (!id) {
                console.error(`ID do conteúdo é inválido:`, id);
                return;
            }

            console.log("Carregando comentários para:", {
                contentId: id,
                contentType: type,
            });

            let query = supabase
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
                );
            
            // Aplicar filtro com base no tipo de conteúdo
            if (type === "chapter") {
                query = query.eq("chapter_id", id);
            } else if (type === "series") {
                query = query.eq("series_id", id);
            } else {
                query = query.eq("story_id", id);
            }
            
            const { data, error } = await query.order("created_at", { ascending: true });

            if (error) {
                console.error("Erro ao buscar comentários:", error);
                return;
            }

            console.log("Comentários carregados:", data?.length || 0);
            setComments(data || []);
        } catch (err) {
            console.error("Exceção ao carregar comentários:", err);
            setComments([]);
        }
    };

    async function fetchUsername(uid) {
        if (!uid) return;
        
        try {
            const { data } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", uid)
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
        
        // Verificar se está logado
        const activeUserId = currentUserId || userSession;

        if (!activeUserId) {
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
            // Verificar se ID é válido
            if (!id) {
                console.error("ID inválido:", id);
                throw new Error(`ID do ${type} inválido`);
            }

            // Preparar dados para a API
            const commentData = {
                text: newComment,
                authorId: activeUserId,
                parentId: replyTo ? replyTo.id : null,
            };

            // Adicionar o ID adequado com base no tipo de comentário
            if (type === "chapter") {
                commentData.chapterId = id;
            } else if (type === "series") {
                commentData.seriesId = id;
            } else {
                commentData.storyId = id;
            }

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
                    {currentUserId && (
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

            {currentUserId ? (
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
