import * as React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Usar o Button migrado

// Props do Modal de Confirmação
interface ConfirmDeleteModalProps {
    isOpen: boolean; // Modal agora é controlado externamente
    onClose: () => void;
    onConfirm: () => void | Promise<void>; // Função a ser chamada ao confirmar
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isDeleting?: boolean; // Estado de carregamento/desabilitado
}

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Exclusão",
    message = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
    confirmText = "Excluir",
    cancelText = "Cancelar",
    isDeleting = false,
}: ConfirmDeleteModalProps) {
    if (!isOpen) return null;

    const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isDeleting) return;
        await onConfirm();
        // onClose será chamado externamente ou pelo botão Cancelar
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            aria-labelledby="modal-title"
            role="dialog" 
            aria-modal="true"
            onClick={onClose} // Fechar ao clicar fora
        >
            <div 
                className="relative bg-background rounded-lg shadow-xl max-w-md w-full mx-4 border border-border"
                onClick={(e) => e.stopPropagation()} // Prevenir fechar ao clicar dentro
            >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground" id="modal-title">{title}</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Fechar"
                        disabled={isDeleting}
                        className="text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Corpo */}
                <div className="p-6 text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-destructive" />
                    <p className="mb-5 text-base text-muted-foreground">{message}</p>
                </div>

                {/* Rodapé com Botões */}
                <div className="flex items-center justify-center p-4 space-x-4 border-t border-border rounded-b">
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Excluindo..." : confirmText}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </Button>
                </div>
            </div>
        </div>
    );
} 