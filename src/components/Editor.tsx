"use client";

import { useState } from "react";

interface EditorProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function Editor({ value = "", onChange }: EditorProps) {
  const [editorValue, setEditorValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditorValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <div className="hint">
          Este editor é uma versão simplificada. Você pode usar HTML básico como <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;p&gt;</code>.
        </div>
      </div>
      <textarea
        className="content-editor"
        value={editorValue}
        onChange={handleChange}
        rows={15}
        placeholder="Comece a escrever sua história aqui..."
      />
    </div>
  );
}
