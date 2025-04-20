"use client";

import { useState, useEffect } from "react";
import * as React from "react"; // Importar React para tipos

// Definir interface para as props
interface EditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
    // Sincronizar o estado interno se a prop 'value' externa mudar
    const [editorValue, setEditorValue] = useState<string>(value || "");

    useEffect(() => {
        setEditorValue(value || "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setEditorValue(newValue);
        onChange(newValue);
    };

    return (
        <div className="editor-container relative rounded-md border border-input bg-background p-4 shadow-sm">
             {/* Remover toolbar antiga, focar no textarea */}
             {/* A versão com TipTap é mais completa */}
            <textarea
                className="content-editor w-full resize-none appearance-none bg-transparent p-2 text-base placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editorValue}
                onChange={handleChange}
                rows={15}
                placeholder="Comece a escrever sua história aqui..."
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                 Este editor é simplificado. Use HTML básico como <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>.
            </div>
        </div>
    );
} 