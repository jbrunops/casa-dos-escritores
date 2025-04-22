"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { RefreshCw, MessageSquare, Reply, X } from "lucide-react";
import Image from "next/image";

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
                .from("comments_with_author")
                .select(
                    `
                id, 
                text,
                created_at,
                author_id,
                parent_id,
                author_username,
                author_avatar_url
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
                console.error("[Client] Erro detalhado ao buscar comentários:", error?.message || error, JSON.stringify(error, null, 2));
                console.error("[Client] Stack do erro ao buscar comentários:", error?.stack);
                return;
            }

            console.log("Comentários carregados:", data?.length || 0);
            setComments(data || []);
        } catch (err) {
            console.error("[Client] Exceção detalhada ao carregar comentários:", err?.message || err, JSON.stringify(err, null, 2));
            console.error("[Client] Stack da exceção ao carregar comentários:", err?.stack);
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
        setNewComment(`@${comment.author_username || "Usuário"} `);
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
            <div key={comment.id} className={`ml-${level * 4} mt-4`}>
                <div className="flex items-start space-x-3">
                    {/* Avatar */} 
                    <Link href={`/profile/${comment.author_id}`}>
                        <Image
                            src={comment.author_avatar_url || "/avatar-placeholder.png"}
                            alt={comment.author_username || "Avatar"}
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center mb-1">
                            <Link href={`/profile/${comment.author_id}"`}>
                                <span className="font-semibold text-sm mr-2">
                                    {comment.author_username || "Usuário Anônimo"}
                                </span>
                             </Link>
                            <span className="text-xs text-gray-500">
                                {new Date(
                                    comment.created_at
                                ).toLocaleDateString("pt-BR")}
                            </span>
                        </div>
                        <p className="text-gray-800 mt-2">{comment.text}</p>
                        {currentUserId && (
                            <div className="mt-3">
                                <button
                                    onClick={() => handleReply(comment)}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#484DB5] transition-colors duration-200"
                                >
                                    <Reply size={14} />
                                    <span>Responder</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Renderizar respostas recursivamente */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="border-l-2 border-[#E5E7EB] pl-4 ml-4">
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
        <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare size={24} />
                <span>Comentários ({comments.length})</span>
            </h2>

            <div className="mb-8">
                {replyTo && (
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md mb-4 border border-[#E5E7EB]">
                        <span className="text-sm">
                            Respondendo para{" "}
                            <span className="font-medium">{replyTo.author_username || "Usuário"}</span>
                        </span>
                        <button
                            type="button"
                            onClick={cancelReply}
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            aria-label="Cancelar resposta"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 mb-4 bg-green-50 text-green-600 rounded-md border border-green-200">
                        Comentário publicado com sucesso!
                    </div>
                )}

                {!currentUserId ? (
                    <div className="border border-[#E5E7EB] rounded-md p-6 text-center">
                        <p className="mb-4 text-gray-700">
                            Para deixar um comentário é preciso estar logado
                        </p>
                        <Link 
                            href="/login" 
                            className="inline-block h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-colors duration-200 flex items-center justify-center"
                        >
                            Fazer login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escreva seu comentário..."
                            disabled={submitting}
                            className="w-full p-3 border border-[#E5E7EB] rounded-md min-h-[120px] focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none resize-y transition-all duration-200"
                            required
                        />
                        
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-gray-500">
                                Comentando como <span className="font-medium">{username || "Usuário"}</span>
                            </span>
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    "Comentar"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-t border-b border-[#E5E7EB]">
                    <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </div>
            ) : (
                <div className="divide-y divide-[#E5E7EB]">
                    {renderComments()}
                </div>
            )}

            <button 
                onClick={loadComments} 
                className="mt-6 flex items-center gap-2 text-[#484DB5] hover:underline transition-all duration-200"
            >
                <RefreshCw size={16} />
                <span>Atualizar comentários</span>
            </button>
        </div>
    );
}
