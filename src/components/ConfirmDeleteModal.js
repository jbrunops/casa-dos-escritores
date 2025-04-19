import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Exclusão",
    message = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
    confirmText = "Excluir",
    cancelText = "Cancelar",
    isDeleting = false, // Para mostrar estado de carregamento/desabilitar botão
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}> {/* Previne fechar ao clicar dentro */}
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-gray-900" id="modal-title">{title}</h3>
                    <button
                        type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                        onClick={onClose}
                        aria-label="Fechar"
                        disabled={isDeleting}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corpo */}
                <div className="p-6 text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                    <p className="mb-5 text-base text-gray-600">{message}</p>
                </div>

                {/* Rodapé com Botões */}
                <div className="flex items-center justify-center p-4 space-x-4 border-t border-border rounded-b">
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-6 py-2.5 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? "Excluindo..." : confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-6 py-2.5 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-primary focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
} 