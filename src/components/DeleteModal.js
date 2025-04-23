// src/components/DeleteModal.js
"use client";

import { useEffect } from "react";
import { X, RefreshCw } from "lucide-react";

export default function DeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading,
}) {
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
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg w-full max-w-md border border-border shadow-xl transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-enter"
                onClick={handleContentClick}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title || "Confirmar Ação"}</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full p-1"
                        aria-label="Fechar modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-700">
                        {message || "Tem certeza que deseja prosseguir? Esta ação não pode ser desfeita."}
                    </p>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end space-x-3 rounded-b-lg">
                    <button 
                        className="px-4 py-2 border border-border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="animate-spin h-4 w-4 text-white" />
                                <span className="sr-only">Processando...</span>
                            </>
                        ) : (
                            "Excluir"
                        )}
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes modal-enter {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-modal-enter {
                    animation: modal-enter 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
