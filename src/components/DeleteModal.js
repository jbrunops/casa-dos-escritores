// src/components/DeleteModal.js
"use client";

import { useEffect } from "react";

export default function DeleteModal({ isOpen, onClose, onConfirm, title }) {
    // Prevenir scroll quando o modal estiver aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Fechar com a tecla ESC
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
        }

        return () => {
            document.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Impedir que cliques no conteúdo do modal fechem o modal
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Overlay
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose} // Fecha ao clicar fora
        >
            {/* Container do Modal */}
            <div 
                className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border border-border"
                onClick={handleContentClick} // Previne fechar ao clicar dentro
            >
                {/* Cabeçalho */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Excluir {title || 'Item'}</h3>
                </div>
                {/* Corpo */}
                <div className="mb-6">
                    <p className="text-sm text-gray-600">
                        Tem certeza que deseja excluir {title ? `este ${title.toLowerCase()}` : 'este item'}? Esta ação não pode ser desfeita.
                    </p>
                </div>
                {/* Ações */}
                <div className="flex justify-end space-x-3">
                    <button 
                        className="h-10 px-4 rounded-md border border-border text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="h-10 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                        onClick={onConfirm}
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}
