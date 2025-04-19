"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { RefreshCw, MessageSquare, Reply, X } from "lucide-react";

// Interface para o perfil (ajuda na clareza)
// interface Profile {
//     id: string;
//     username: string | null;
//     avatar_url: string | null;
// }

// Interface para o comentário combinado (ajuda na clareza)
// interface CombinedComment {
//     id: string;
//     text: string;
//     created_at: string;
//     author_id: string;
//     parent_id: string | null;
//     author_profile: Profile | null; // Perfil aninhado
//     replies: CombinedComment[];
// }

export default function Comments({
    contentId,
    contentType,
    userId,
    // authorId, // Prop authorId não é mais usada diretamente aqui
}) {
    console.log("[Comments Component] Props recebidas:", { contentId, contentType, userId });

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState(null); // Armazena username e avatar do usuário logado
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const supabase = createBrowserClient();
    const commentInputRef = useRef(null);
    // const [userSessionId, setUserSessionId] = useState(null); // Removido, usaremos userId diretamente ou getUser

    const id = contentId;
    const type = contentType;
    const currentUserId = userId;

    // Busca perfil do usuário logado (apenas uma vez)
    useEffect(() => {
        async function fetchUserProfile() {
            if (currentUserId) {
                try {
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("username, avatar_url")
                        .eq("id", currentUserId)
                        .single();
                    if (error) throw error;
                    setUserProfile(data);
                } catch (err) {
                    console.error("Erro ao buscar perfil do usuário logado:", err);
                }
            }
        }
        fetchUserProfile();
    }, [currentUserId, supabase]);

    // Carrega comentários quando ID ou Tipo mudam
    useEffect(() => {
        if (id && type) {
            loadComments();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, type]); // Dependência apenas em id e type

    useEffect(() => {
        if (replyTo && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [replyTo]);

    const loadComments = async () => {
        setLoading(true);
        setError(null);
        console.log("[Comments loadComments] Iniciando busca para:", { contentId, contentType });

        try {
            if (!id || !type) {
                console.error(`[Comments] ID (${id}) ou Tipo (${type}) do conteúdo é inválido.`);
                setError("Não foi possível carregar comentários: ID ou Tipo inválido.");
                setComments([]);
                setLoading(false);
                return;
            }

            // 1. Buscar dados base dos comentários
            let commentsQuery = supabase
                .from("comments")
                .select(
                    `
                id,
                text,
                created_at,
                author_id,
                parent_id
                `
                )
                .order("created_at", { ascending: true });
            
            if (type === "chapter") {
                commentsQuery = commentsQuery.eq("chapter_id", id);
            } else if (type === "series") {
                commentsQuery = commentsQuery.eq("series_id", id);
            } else if (type === "story") {
                commentsQuery = commentsQuery.eq("story_id", id);
            } else {
                console.error(`[Comments] loadComments: Tipo de conteúdo desconhecido: ${type}`);
                setError(`Tipo de conteúdo desconhecido: ${type}`);
                setLoading(false);
                return;
            }
            
            const { data: baseComments, error: commentsError } = await commentsQuery;

            if (commentsError) {
                console.error("[Comments] Erro na query ao buscar comentários base:", { 
                    message: commentsError.message, 
                    details: commentsError.details, 
                    code: commentsError.code, 
                    hint: commentsError.hint,
                    errorObj: commentsError
                 });
                setError("Erro ao carregar dados dos comentários. Tente novamente.");
                setComments([]);
                setLoading(false);
                return;
            }
            
            if (!baseComments || baseComments.length === 0) {
                console.log("[Comments loadComments] Nenhum comentário base encontrado.");
                setComments([]);
                setLoading(false);
                return;
            }
            
            console.log("[Comments loadComments] Comentários base carregados:", baseComments.length);

            // 2. Extrair IDs de autores únicos
            const authorIds = [...new Set(baseComments.map(comment => comment.author_id).filter(Boolean))];
            
            let profilesMap = {};

            // 3. Buscar perfis dos autores se houver IDs
            if (authorIds.length > 0) {
                console.log("[Comments loadComments] Buscando perfis para autores:", authorIds);
                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", authorIds);

                if (profilesError) {
                    console.error("[Comments] Erro ao buscar perfis dos autores:", {
                         message: profilesError.message,
                         details: profilesError.details,
                         code: profilesError.code,
                         hint: profilesError.hint,
                         errorObj: profilesError
                    });
                    // Não definir erro fatal aqui, podemos mostrar comentários sem perfil
                    setError("Erro ao carregar informações de alguns autores."); 
                } else if (profilesData) {
                    console.log("[Comments loadComments] Perfis carregados:", profilesData.length);
                    profilesMap = profilesData.reduce((map, profile) => {
                        map[profile.id] = profile;
                        return map;
                    }, {});
                }
            }

            // 4. Combinar comentários com perfis
            const combinedComments = baseComments.map(comment => ({
                ...comment,
                author_profile: profilesMap[comment.author_id] || null // Adiciona perfil ao comentário
            }));

            console.log("[Comments loadComments] Comentários combinados com perfis:", combinedComments);
            setComments(combinedComments);

        } catch (err) {
            console.error("[Comments] Exceção inesperada ao carregar comentários:", err instanceof Error ? err.message : err, err); 
            setError("Ocorreu um erro inesperado ao carregar comentários.");
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    // fetchUsername não é mais necessário aqui, perfil do usuário logado é buscado separadamente
    // async function fetchUsername(uid) { ... }

    async function handleSubmitComment(e) {
        e.preventDefault();

        // Usa o ID do usuário logado diretamente (se disponível)
        if (!currentUserId) {
            // Tenta pegar do Supabase auth se não veio via prop (caso de usuário deslogado inicialmente)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Você precisa estar logado para comentar");
                return;
            }
            // Se pegou o usuário, usa o ID dele
            // (Idealmente, a prop userId deveria ser sempre confiável se o usuário estiver logado)
            // Mas isso adiciona uma camada extra de segurança.
            if (!currentUserId) {
                 console.warn("[Comments handleSubmit] Prop userId estava faltando, usando supabase.auth.getUser().id");
            }
            // Define o ID ativo para a submissão
             const activeUserId = currentUserId || user.id;
             
             // Validação adicional
             if (!activeUserId) {
                  setError("Não foi possível determinar o ID do usuário para comentar.");
                  return;
             }
             
             // ... (restante da lógica de submissão usando activeUserId)
             
        } else {
             // Se currentUserId veio via prop, usa ele diretamente
             const activeUserId = currentUserId;
             // ... (lógica de submissão duplicada - refatorar depois) 
        }
        
        // --- Lógica de Submissão Refatorada (para evitar duplicação) ---
        const submitLogic = async (activeUserId) => {
             if (!newComment.trim()) {
                setError("O comentário não pode estar vazio");
                return;
            }
    
            setSubmitting(true);
            setError(null);
    
            try {
                if (!id || !type) {
                    console.error("[Comments] handleSubmit: ID ou Tipo inválido", { id, type });
                    throw new Error(`ID (${id}) ou Tipo (${type}) inválido`);
                }
    
                const commentData = {
                    text: newComment,
                    author_id: activeUserId, // API espera author_id (com underscore)
                    parent_id: replyTo ? replyTo.id : null, // API espera parent_id
                    ...(type === 'story' && { story_id: id }),
                    ...(type === 'chapter' && { chapter_id: id }),
                    ...(type === 'series' && { series_id: id }),
                };
    
                // Verificar se API espera storyId ou story_id, etc. Ajustar aqui se necessário.
                // Baseado na leitura anterior da API, parece esperar com underscore.
                 if (!commentData.story_id && !commentData.chapter_id && !commentData.series_id) {
                    console.error("[Comments] Nenhum ID de conteúdo (_id) foi definido para o tipo:", type, "ID:", id);
                    throw new Error(`Tipo de conteúdo inválido ou não suportado: ${type}`);
                 }
    
                console.log("[Comments] Enviando comentário para API:", commentData);
    
                const response = await fetch("/api/comments", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(commentData),
                });
    
                const result = await response.json();
                console.log("[Comments] Resposta da API de comentários:", result);
    
                if (!response.ok) {
                    const errorMessage =
                        result.error || "Erro ao adicionar comentário";
                    const errorDetails = result.details
                        ? JSON.stringify(result.details)
                        : "";
                    throw new Error(`${errorMessage} ${errorDetails}`);
                }
    
                setNewComment("");
                setReplyTo(null);
                setSuccess(true);
    
                await loadComments(); // Recarrega comentários após sucesso
    
                setTimeout(() => {
                    setSuccess(false);
                }, 3000);
            } catch (err) {
                console.error("Erro detalhado ao submeter:", err);
                setError(`Erro ao enviar: ${err.message}`);
            } finally {
                setSubmitting(false);
            }
        };
        
        // Determina o ID do usuário e chama a lógica de submissão
        if (currentUserId) {
             submitLogic(currentUserId);
        } else {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 submitLogic(user.id);
             } else {
                  setError("Você precisa estar logado para comentar");
             }
        }
       // --- Fim da Lógica Refatorada ---
    }

    const handleReply = (comment) => {
        // Usa author_profile que agora está nos dados combinados
        setReplyTo(comment);
        setNewComment(`@${comment.author_profile?.username || "Usuário"} `);
    };

    const cancelReply = () => {
        setReplyTo(null);
        setNewComment("");
    };

    // Função recursiva para renderizar comentários e suas respostas
    const renderCommentsRecursive = (commentList, level = 0) => {
        return commentList.map((comment) => (
            <div
                key={comment.id}
                className={`py-4 ${level > 0 ? "pl-6 md:pl-10 border-l border-border ml-4 md:ml-6" : "border-b border-border"}`}
            >
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            {/* Usa author_profile */}
                            {comment.author_profile?.avatar_url ? (
                                <img
                                    src={comment.author_profile.avatar_url}
                                    alt={comment.author_profile?.username || "Usuário"}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                                    {(comment.author_profile?.username || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}
                            <span className="font-medium text-gray-800">
                                {comment.author_profile?.username || "Usuário Anônimo"} 
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <p className="text-gray-700 pl-10">{comment.text}</p> {/* Leve indentação do texto */}
                    {currentUserId && (
                        <div className="mt-2 pl-10"> {/* Leve indentação do botão */}
                            <button
                                onClick={() => handleReply(comment)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors duration-200"
                            >
                                <Reply size={12} />
                                <span>Responder</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Renderiza respostas recursivamente */}
                {comment.replies && comment.replies.length > 0 && (
                     renderCommentsRecursive(comment.replies, level + 1)
                )}
            </div>
        ));
    };
    
    // Processa a lista plana de comentários em uma estrutura aninhada
    const getNestedComments = () => {
        const commentMap = {};
        const rootComments = [];

        comments.forEach((comment) => {
            // Adiciona a propriedade replies a cada comentário
            commentMap[comment.id] = { ...comment, replies: [] }; 
        });

        comments.forEach((comment) => {
            if (comment.parent_id && commentMap[comment.parent_id]) {
                 // Adiciona a resposta ao array replies do pai
                commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
            } else if (!comment.parent_id) {
                // Adiciona comentários raiz à lista
                rootComments.push(commentMap[comment.id]);
            }
        });
        
        return rootComments;
    };

    const nestedComments = getNestedComments();

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare size={24} />
                {/* Usa comments.length para contagem total, não apenas raiz */}
                <span>Comentários ({comments.length})</span> 
            </h2>

            <div className="mb-8">
                {replyTo && (
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md mb-4 border border-border">
                        <span className="text-sm">
                            Respondendo para{" "}
                            <span className="font-medium">{replyTo.author_profile?.username || "Usuário"}</span>
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

                {/* Formulário de Comentário (Apenas para usuários logados) */}
                {currentUserId ? (
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Respondendo a ${replyTo.author_profile?.username || "Usuário"}...` : "Escreva seu comentário..."}
                            disabled={submitting}
                            className="w-full p-3 border border-border rounded-md min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-y transition-all duration-200 bg-white"
                            required
                        />
                        
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-gray-500">
                                Comentando como{" "}
                                <span className="font-medium">{userProfile?.username || "Usuário"}</span>
                            </span>
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="h-10 px-5 bg-primary text-white rounded-md hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    replyTo ? "Responder" : "Comentar"
                                )}
                            </button>
                        </div>
                    </form>
                 ) : (
                     <div className="border border-border rounded-md p-6 text-center bg-gray-50">
                         <p className="mb-4 text-gray-700">
                             Para deixar um comentário, por favor{" "}
                             <Link href="/login" className="text-primary hover:underline font-medium">faça login</Link>.
                         </p>
                     </div>
                 )}
            </div>

            {/* Lista de Comentários */}            
            {loading ? (
                <div className="text-center py-8 text-gray-500"><p>Carregando comentários...</p></div>
            ) : nestedComments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-t border-border">
                    <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </div>
            ) : (
                <div className="border-t border-border">
                    {renderCommentsRecursive(nestedComments)}
                </div>
            )}

            {!loading && (
                <button 
                    onClick={loadComments} 
                    disabled={loading}
                    className="mt-6 flex items-center gap-2 text-primary hover:underline transition-all duration-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
                    <span>Atualizar comentários</span>
                </button>
            )}
        </div>
    );
}
