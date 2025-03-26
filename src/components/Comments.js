// src/components/Comments.js
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { RefreshCw, MessageSquare } from "lucide-react";

export default function Comments({ storyId, sessionId, authorId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [username, setUsername] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        // Carregar comentários iniciais
        loadComments();

        if (sessionId) {
            fetchUsername();
        }
    }, [storyId, sessionId]);

    // Função para carregar comentários de forma confiável
    const loadComments = async () => {
        try {
            // Certifique-se de que o storyId esteja em um formato que o Supabase espera
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
          profiles(username)
        `
                )
                .eq("story_id", storyId)
                .order("created_at", { ascending: false });

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
            const { data, error: insertError } = await supabase
                .from("comments")
                .insert([
                    {
                        text: newComment,
                        story_id: storyId,
                        author_id: sessionId,
                    },
                ])
                .select();

            if (insertError) {
                console.error("Erro ao inserir comentário:", insertError);
                throw insertError;
            }

            setNewComment("");
            setSuccess(true);
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

                    <textarea
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
                    comments.map((comment) => (
                        <div key={comment.id} className="comment">
                            <div className="comment-header">
                                <span className="comment-author">
                                    {comment.profiles?.username || "Usuário"}
                                </span>
                                <span className="comment-date">
                                    {new Date(
                                        comment.created_at
                                    ).toLocaleDateString("pt-BR")}
                                </span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                        </div>
                    ))
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
