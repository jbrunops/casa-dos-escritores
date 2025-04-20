"use client";

import { useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Definir interface para as props
interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string; // Título do item a ser excluído (ex: "História", "Comentário")
    confirmText?: string;
    cancelText?: string;
    isDeleting?: boolean; // Para estado de loading
}

export default function DeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    confirmText = "Excluir",
    cancelText = "Cancelar",
    isDeleting = false,
}: DeleteModalProps) {
    // Prevenir scroll quando o modal estiver aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        // Cleanup function
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Fechar com a tecla ESC
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
        }
        // Cleanup function
        return () => {
            document.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isDeleting) return;
        await onConfirm();
    };

    // Impedir que cliques no conteúdo do modal fechem o modal
    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    return (
        // Overlay
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose} // Fecha ao clicar fora
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
            {/* Container do Modal */}
            <div
                className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md border border-border"
                onClick={handleContentClick} // Previne fechar ao clicar dentro
            >
                {/* Cabeçalho */}
                <div className="flex justify-between items-center mb-4">
                    <h3 id="delete-modal-title" className="text-lg font-semibold text-foreground">Excluir {title || 'Item'}</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        disabled={isDeleting}
                        aria-label="Fechar"
                        className="text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                {/* Corpo */}
                <div className="mb-6">
                    <p className="text-sm text-muted-foreground">
                        Tem certeza que deseja excluir {title ? `este ${title.toLowerCase()}` : 'este item'}? Esta ação não pode ser desfeita.
                    </p>
                </div>
                {/* Ações */}
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Excluindo..." : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
} 