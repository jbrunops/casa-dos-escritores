"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Edit3, Trash2 } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import DeleteModal from "./DeleteModal";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function ProfileStoryActions({ story, isOwnProfile }) {
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: "" });
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const supabase = createBrowserClient();
    const router = useRouter();

    if (!isOwnProfile) {
        // Se não for o perfil próprio, retorna apenas o botão de visualizar (ou nada, se preferir)
        return (
            <Link
                href={`/story/${generateSlug(story.title, story.id)}`}
                title="Visualizar"
                className="text-gray-400 hover:text-primary p-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
            >
                <Eye size={18} />
            </Link>
        );
    }

    const openDeleteModalHandler = () => {
        setErrorMessage("");
        setSuccessMessage("");
        setDeleteModal({ open: true, id: story.id, title: story.title });
    };

    const closeDeleteModalHandler = () => {
        setDeleteModal({ open: false, id: null, title: "" });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) {
            setErrorMessage("Erro: ID da história não encontrado.");
            return;
        }
        setDeleting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const { error } = await supabase
                .from("stories")
                .delete()
                .eq("id", deleteModal.id);

            if (error) {
                console.error("Erro ao excluir história:", error);
                 if (error.code === '23503') {
                    throw new Error("Não é possível excluir a história pois existem comentários ou outros dados associados.");
                } else if (error.code === '42501') {
                     throw new Error("Permissão negada pela política de segurança para excluir.");
                } else {
                    throw new Error(error.message || "Erro desconhecido ao excluir história.");
                }
            }

            setSuccessMessage("História excluída com sucesso!");
            closeDeleteModalHandler();
            // Idealmente, forçar a atualização da lista de histórias na página de perfil.
            // Como estamos em Server Component, a forma mais simples é recarregar.
            // router.refresh(); // Poderia ser usado em Client Component
            // Para Server Component, pode ser necessário passar uma função de callback ou usar outra estratégia de revalidação.
            // Por ora, a mensagem de sucesso indicará a ação.
            window.location.reload(); // Recarrega a página para atualizar a lista (solução simples)

        } catch (err) {
            console.error("Falha na exclusão:", err);
            setErrorMessage(`Erro: ${err.message}`);
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex items-center justify-end space-x-1">
             {/* Mensagens de feedback dentro das ações */}
            {/* {successMessage && <span className="text-xs text-green-600 mr-2">{successMessage}</span>} */} 
            {/* {errorMessage && <span className="text-xs text-red-600 mr-2">{errorMessage}</span>} */} 

            <Link
                href={`/story/${generateSlug(story.title, story.id)}`}
                title="Visualizar"
                className="text-gray-400 hover:text-primary p-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
            >
                <Eye size={18} />
            </Link>
            <Link
                href={`/dashboard/edit/${story.id}`}
                title="Editar"
                className="text-gray-400 hover:text-primary p-2 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
            >
                <Edit3 size={18} />
            </Link>
            <button
                onClick={openDeleteModalHandler}
                title="Excluir"
                className="text-gray-400 hover:text-red-600 p-2 inline-flex items-center justify-center rounded-md hover:bg-red-50"
                disabled={deleting}
            >
                <Trash2 size={18} />
            </button>

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModalHandler}
                onConfirm={handleDeleteConfirm}
                title={`Excluir História`}
                message={`Tem certeza que deseja excluir a história "${deleteModal.title}"? Esta ação não pode ser desfeita.`}
                isLoading={deleting}
                errorMessage={errorMessage} // Passa o erro para o modal
            />
        </div>
    );
} 