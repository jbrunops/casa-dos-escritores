"use client";

import { useState } from "react";

export default function Editor({ value, onChange }) {
    const [editorValue, setEditorValue] = useState(value || "");

    const handleChange = (e) => {
        const newValue = e.target.value;
        setEditorValue(newValue);
        onChange(newValue);
    };

    return (
        <div className="w-full border border-gray-200 rounded-md shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="text-sm text-gray-600 italic">
                    Este editor é uma versão simplificada. Você pode usar HTML
                    básico como <code className="px-1 py-0.5 bg-gray-100 rounded text-purple-600">&lt;b&gt;</code>, <code className="px-1 py-0.5 bg-gray-100 rounded text-purple-600">&lt;i&gt;</code>,{" "}
                    <code className="px-1 py-0.5 bg-gray-100 rounded text-purple-600">&lt;p&gt;</code>.
                </div>
            </div>
            <textarea
                className="w-full p-4 min-h-[300px] border-0 focus:ring-0 focus:outline-none"
                value={editorValue}
                onChange={handleChange}
                rows={15}
                placeholder="Comece a escrever sua história aqui..."
            />
        </div>
    );
}
