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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={handleContentClick}>
                <div className="modal-header">
                    <h3>Excluir {title}</h3>
                </div>
                <div className="modal-body">
                    <p>
                        Tem certeza que deseja excluir esta história? Esta ação
                        não pode ser desfeita.
                    </p>
                </div>
                <div className="modal-actions">
                    <button className="modal-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="modal-confirm" onClick={onConfirm}>
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}
