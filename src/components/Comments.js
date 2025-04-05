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
                className={`mb-4 ${
                    level > 0 ? "pl-4 md:pl-6 border-l-2 border-gray-200" : ""
                }`}
            >
                <div
                    className="bg-white rounded-lg p-4 shadow-sm"
                    style={{ marginLeft: `${level * 8}px` }}
                >
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                            {comment.profiles?.avatar_url ? (
                                <img
                                    src={comment.profiles.avatar_url}
                                    alt={
                                        comment.profiles?.username || "Usuário"
                                    }
                                    className="w-8 h-8 rounded-full mr-2 object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full mr-2 bg-purple-600 text-white flex items-center justify-center">
                                    {(comment.profiles?.username || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}
                            <span className="font-medium text-gray-800">
                                {comment.profiles?.username || "Usuário"}
                            </span>
                        </div>
                        <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString(
                                "pt-BR"
                            )}
                        </span>
                    </div>
                    <p className="text-gray-700 mb-2">{comment.text}</p>
                    {currentUserId && (
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => handleReply(comment)}
                                className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
                            >
                                <Reply size={16} className="mr-1" />
                                <span>Responder</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Renderizar respostas recursivamente */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-4">
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                <span className="flex items-center justify-center mr-2 text-purple-600">
                    <MessageSquare size={20} />
                </span>
                Comentários ({comments.length})
            </h3>

            {currentUserId ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
                            Comentário publicado com sucesso!
                        </div>
                    )}

                    {replyTo && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                            <span className="text-sm text-gray-600">
                                Respondendo para{" "}
                                <span className="font-medium">{replyTo.profiles?.username || "Usuário"}</span>
                            </span>
                            <button
                                type="button"
                                onClick={cancelReply}
                                className="text-gray-500 hover:text-red-500 transition-colors"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent mb-3 min-h-[100px]"
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {submitting ? (
                            <>
                                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                <span>Enviando...</span>
                            </>
                        ) : (
                            "Comentar"
                        )}
                    </button>
                </form>
            ) : (
                <p className="text-gray-700 mb-6">
                    <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">Faça login</Link> para comentar
                </p>
            )}

            <div className="mb-4">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-md">
                        Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                ) : (
                    renderComments()
                )}
            </div>

            <button onClick={loadComments} className="flex items-center text-gray-600 hover:text-purple-600 transition-colors">
                <RefreshCw size={16} className="mr-1" />
                Atualizar comentários
            </button>
        </div>
    );
}
