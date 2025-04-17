"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { RefreshCw, MessageSquare, Reply, X } from "lucide-react";

interface CommentsProps {
    storyId?: string;
    contentId?: string;
    contentType?: string;
    sessionId?: string;
    userId?: string;
    authorId?: string;
    isSeriesComment?: boolean;
}

interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    parent_id?: string;
    username?: string;
    replies?: Comment[];
}

export default function Comments({
    storyId,
    contentId,
    contentType,
    sessionId,
    userId,
    authorId,
    isSeriesComment = false,
}: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const supabase = createBrowserClient();
    const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
    const [userSession, setUserSession] = useState<string | null>(null);

    const id = contentId || storyId;
    const type = contentType || (isSeriesComment ? "series" : "story");
    const currentUserId = userId || sessionId;

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
        loadComments();
    }, [id]);

    useEffect(() => {
        if (replyTo && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [replyTo]);

    async function fetchUsername(uid: string) {
        // Implemente a lógica para buscar o username do usuário
    }

    async function loadComments() {
        // Implemente a lógica para carregar os comentários
    }

    async function handleCommentSubmit() {
        // Implemente a lógica para submeter um comentário
    }

    return (
        <div>{/* Renderização dos comentários e formulário */}</div>
    );
}
