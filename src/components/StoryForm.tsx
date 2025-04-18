import React, { useState } from 'react';
import { Story, StoryType, Chapter } from '../lib/storyTypes';
import { ChapterManager } from './ChapterManager';

interface StoryFormProps {
  initialStory?: Partial<Story>;
  onSubmit: (story: Story) => void;
}

export const StoryForm: React.FC<StoryFormProps> = ({ initialStory = {}, onSubmit }) => {
  const [type, setType] = useState<StoryType>(initialStory.type || 'SINGLE');
  const [title, setTitle] = useState(initialStory.title || '');
  const [description, setDescription] = useState(initialStory.description || '');
  const [author, setAuthor] = useState(initialStory.author || '');
  const [chapters, setChapters] = useState<Chapter[]>(
    initialStory.chapters && initialStory.chapters.length > 0
      ? initialStory.chapters
      : [{ id: Math.random().toString(36).substring(2, 9), title: '', content: '', createdAt: new Date().toISOString() }]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialStory.id || Math.random().toString(36).substring(2, 9),
      title,
      description: type === 'SERIES' ? description : undefined,
      type,
      chapters,
      author,
      createdAt: initialStory.createdAt || new Date().toISOString(),
      commentsCount: initialStory.commentsCount || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de história</label>
        <select
          className="w-full border rounded px-2 py-1"
          value={type}
          onChange={e => setType(e.target.value as StoryType)}
        >
          <option value="SINGLE">Conto Único</option>
          <option value="SERIES">Série</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      {type === 'SERIES' && (
        <div>
          <label className="block text-sm font-medium mb-1">Nome da Série</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required={type === 'SERIES'}
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Autor</label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          required
        />
      </div>
      <ChapterManager type={type} chapters={chapters} onChange={setChapters} />
      <button
        type="submit"
        className="w-full py-2 bg-[#484DB5] text-white rounded font-semibold hover:bg-[#373a8d] transition"
      >
        Salvar história
      </button>
    </form>
  );
};
