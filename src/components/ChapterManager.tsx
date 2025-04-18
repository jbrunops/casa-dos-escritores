import React, { useState } from 'react';
import { Story, StoryType, Chapter } from '../lib/storyTypes';

interface ChapterManagerProps {
  type: StoryType;
  chapters: Chapter[];
  onChange: (chapters: Chapter[]) => void;
}

export const ChapterManager: React.FC<ChapterManagerProps> = ({ type, chapters, onChange }) => {
  const [localChapters, setLocalChapters] = useState<Chapter[]>(chapters);

  const handleChapterChange = (idx: number, field: keyof Chapter, value: string) => {
    const updated = localChapters.map((ch, i) => i === idx ? { ...ch, [field]: value } : ch);
    setLocalChapters(updated);
    onChange(updated);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
    };
    const updated = [...localChapters, newChapter];
    setLocalChapters(updated);
    onChange(updated);
  };

  const removeChapter = (idx: number) => {
    const updated = localChapters.filter((_, i) => i !== idx);
    setLocalChapters(updated);
    onChange(updated);
  };

  // Para 'SINGLE', só permite um capítulo
  if (type === 'SINGLE') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Título do Capítulo</label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          value={localChapters[0]?.title || ''}
          onChange={e => handleChapterChange(0, 'title', e.target.value)}
        />
        <label className="block text-sm font-medium mt-2 mb-1">Conteúdo</label>
        <textarea
          className="w-full border rounded px-2 py-1"
          rows={6}
          value={localChapters[0]?.content || ''}
          onChange={e => handleChapterChange(0, 'content', e.target.value)}
        />
      </div>
    );
  }

  // Para 'SERIES', permite múltiplos capítulos
  return (
    <div className="mb-4">
      {localChapters.map((chapter, idx) => (
        <div key={chapter.id} className="mb-3 border-b pb-3">
          <label className="block text-sm font-medium mb-1">Título do Capítulo {idx + 1}</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            value={chapter.title}
            onChange={e => handleChapterChange(idx, 'title', e.target.value)}
          />
          <label className="block text-sm font-medium mt-2 mb-1">Conteúdo</label>
          <textarea
            className="w-full border rounded px-2 py-1"
            rows={4}
            value={chapter.content}
            onChange={e => handleChapterChange(idx, 'content', e.target.value)}
          />
          <button
            type="button"
            className="mt-2 text-xs text-red-600 hover:underline"
            onClick={() => removeChapter(idx)}
            disabled={localChapters.length === 1}
          >
            Remover capítulo
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mt-2 px-3 py-1 bg-[#484DB5] text-white rounded text-sm"
        onClick={addChapter}
      >
        Adicionar capítulo
      </button>
    </div>
  );
};
