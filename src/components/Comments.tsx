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
             
             // Chamar a lógica de submissão
             await submitLogic(activeUserId);
             
        } else {
             // Se currentUserId veio via prop, usa ele diretamente
             const activeUserId = currentUserId;
             // Chamar a lógica de submissão
             await submitLogic(activeUserId);
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
                    author_id: activeUserId,
                    parent_id: replyTo ? replyTo.id : null,
                };

                // Adiciona a chave estrangeira correta com base no tipo
                if (type === "chapter") {
                    commentData.chapter_id = id;
                } else if (type === "series") {
                    commentData.series_id = id;
                } else if (type === "story") {
                    commentData.story_id = id;
                } else {
                     throw new Error(`Tipo de conteúdo inválido para comentário: ${type}`);
                }

                console.log("[Comments] Enviando novo comentário com dados:", commentData);

                const { data: insertedComment, error: insertError } = await supabase
                    .from("comments")
                    .insert([commentData]) // Supabase espera um array para insert
                    .select(
                        `
                        *,
                        author_profile: profiles!inner(*)
                        `
                    )
                    .single(); // Espera um único resultado de volta
                    
                if (insertError) {
                    console.error("[Comments] Erro ao inserir comentário no banco de dados:", {
                         message: insertError.message,
                         details: insertError.details,
                         code: insertError.code,
                         hint: insertError.hint,
                         errorObj: insertError
                    });
                    throw new Error("Erro ao salvar o comentário. Verifique o console.");
                }

                if (!insertedComment) {
                    console.error("[Comments] Comentário inserido, mas não retornou dados.");
                    throw new Error("Falha ao recuperar dados do comentário recém-criado.");
                }

                console.log("[Comments] Comentário inserido com sucesso:", insertedComment);
                
                // Adiciona o perfil do usuário logado ao comentário recém-criado
                // (Assume que userProfile já foi carregado)
                const commentWithProfile = {
                    ...insertedComment,
                    // Garante que author_profile esteja presente, usando os dados já carregados
                    author_profile: userProfile || { id: activeUserId, username: 'Você', avatar_url: null },
                };

                setComments((prevComments) => [...prevComments, commentWithProfile]);
                setNewComment("");
                setReplyTo(null);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);

            } catch (err) {
                console.error("[Comments] Erro durante a submissão do comentário:", err instanceof Error ? err.message : err, err);
                setError(err.message || "Erro ao enviar comentário");
            } finally {
                setSubmitting(false);
            }
        };
    }

    const handleReply = (comment) => {
        setReplyTo(comment);
        setNewComment(`@${comment.author_profile?.username || 'usuário'} `); // Pré-popula com @username
        // Foco será tratado pelo useEffect
    };

    const cancelReply = () => {
        setReplyTo(null);
        setNewComment("");
    };

    // Função recursiva para renderizar comentários e respostas
    const renderCommentsRecursive = (commentList, level = 0) => {
        return commentList.map((comment) => (
            <div key={comment.id} className={`comment-item ${level > 0 ? 'ml-8 pl-4 border-l border-gray-200' : ''}`}>
                <div className="flex items-start space-x-3 mb-2">
                    <Link href={`/profile/${comment.author_id}`}>
                         {comment.author_profile?.avatar_url ? (
                            <img 
                                src={comment.author_profile.avatar_url} 
                                alt={comment.author_profile.username || "Avatar"} 
                                className="w-8 h-8 rounded-full object-cover border border-gray-300"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-semibold">
                                {comment.author_profile?.username ? comment.author_profile.username.charAt(0).toUpperCase() : "?"}
                            </div>
                        )}
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                             <Link href={`/profile/${comment.author_id}`} className="font-semibold text-sm hover:underline">
                                {comment.author_profile?.username || "Usuário Anônimo"}
                            </Link>
                            <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleString("pt-BR")}
                            </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
                        <div className="flex items-center space-x-3 mt-1">
                            <button 
                                onClick={() => handleReply(comment)}
                                className="text-xs text-gray-500 hover:text-primary flex items-center disabled:opacity-50"
                                disabled={!currentUserId} // Desabilita se não estiver logado
                                title={!currentUserId ? "Faça login para responder" : "Responder"}
                            >
                                <Reply size={14} className="mr-1" />
                                Responder
                            </button>
                            {/* Outras ações como Like/Edit/Delete poderiam ir aqui */} 
                        </div>
                    </div>
                </div>
                {/* Renderiza respostas recursivamente */} 
                {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies mt-2">
                        {renderCommentsRecursive(comment.replies, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    // Organiza comentários em estrutura aninhada
    const getNestedComments = () => {
        if (!comments || comments.length === 0) return [];
        
        const commentMap = {};
        comments.forEach(comment => {
            commentMap[comment.id] = { ...comment, replies: [] }; // Inicializa com array de respostas vazio
        });

        const nestedComments = [];
        comments.forEach(comment => {
            if (comment.parent_id && commentMap[comment.parent_id]) {
                // É uma resposta, adiciona ao array 'replies' do pai
                if (commentMap[comment.parent_id].replies) {
                    commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
                } else {
                     console.warn("Tentativa de adicionar resposta a um comentário sem array 'replies':", comment.parent_id);
                     // Inicializa se estiver faltando (como fallback, mas não deveria acontecer)
                     commentMap[comment.parent_id].replies = [commentMap[comment.id]];
                }
            } else {
                // É um comentário raiz
                nestedComments.push(commentMap[comment.id]);
            }
        });

        // Ordena as respostas dentro de cada comentário pela data de criação
        const sortReplies = (commentNode) => {
            if (commentNode.replies && commentNode.replies.length > 0) {
                commentNode.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                commentNode.replies.forEach(sortReplies); // Ordena recursivamente
            }
        };
        nestedComments.forEach(sortReplies);

        // Ordena os comentários raiz pela data de criação
        nestedComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return nestedComments;
    };

    const nestedComments = getNestedComments();

    return (
        <div className="comments-section bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
                <MessageSquare size={20} className="mr-2 text-primary" />
                Comentários ({comments.length})
                 <button 
                    onClick={loadComments} 
                    className="ml-auto text-gray-500 hover:text-primary disabled:opacity-50 p-1 rounded-full hover:bg-gray-100 transition-colors" 
                    title="Recarregar comentários"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </h3>

            {/* Formulário de Novo Comentário/Resposta */} 
            <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="relative">
                    <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? `Respondendo a ${replyTo.author_profile?.username || 'usuário'}...` : "Adicione um comentário público..."}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed" // Adicionado pr-10 para espaço do X
                        rows="3"
                        disabled={!currentUserId || submitting} // Desabilita se não logado ou enviando
                    />
                     {/* Botão Cancelar Resposta */} 
                    {replyTo && (
                        <button
                            type="button"
                            onClick={cancelReply}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            title="Cancelar resposta"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                {/* Mensagens de erro/sucesso */} 
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-1">Comentário enviado!</p>}
                
                <div className="flex justify-end items-center mt-2">
                    {currentUserId ? (
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={submitting || !newComment.trim()} // Desabilita se enviando ou vazio
                        >
                            {submitting ? "Enviando..." : (replyTo ? "Responder" : "Comentar")}
                        </button>
                    ) : (
                         <p className="text-sm text-gray-600">
                            Faça <Link href="/login" className="text-primary hover:underline">login</Link> para comentar.
                        </p>
                    )}
                </div>
            </form>

            {/* Lista de Comentários */} 
            <div className="space-y-4">
                {loading && (
                    <div className="text-center py-4">
                        <RefreshCw className="mx-auto h-6 w-6 text-primary animate-spin" />
                        <p className="mt-2 text-sm text-gray-500">Carregando comentários...</p>
                    </div>
                )}
                 {!loading && nestedComments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Nenhum comentário ainda. Seja o primeiro!</p>
                )}
                {!loading && nestedComments.length > 0 && (
                    renderCommentsRecursive(nestedComments)
                )}
            </div>
        </div>
    );
} 