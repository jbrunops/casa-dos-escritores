"use client";
import { useEditor, EditorContent, BubbleMenu, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState, useCallback, useEffect } from "react";
import { Eye, Edit2, Columns } from "lucide-react";

interface TipTapEditorProps {
  value?: string;
  content?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({
  value,
  content,
  onChange,
  placeholder = "Comece a escrever sua história aqui...",
}: TipTapEditorProps) {
  // ...restante igual, com tipagem.
}
