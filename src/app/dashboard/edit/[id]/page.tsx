"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStoryStore } from '../../../lib/storyStore';
import dynamic from 'next/dynamic';

const StoryForm = dynamic(() => import('../../../components/StoryForm'), { ssr: false });

const EditStoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const storyId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const story = useStoryStore((state) => state.stories.find(s => s.id === storyId));
  const updateStory = useStoryStore((state) => state.updateStory);

  const [saved, setSaved] = useState(false);

  if (!story) {
    return <div className="container mx-auto px-4 py-8">História não encontrada.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar História</h1>
      <StoryForm
        initialStory={story}
        onSubmit={(updated) => {
          updateStory(updated);
          setSaved(true);
          setTimeout(() => router.push(`/dashboard/${story.id}`), 1000);
        }}
      />
      {saved && (
        <div className="mt-4 text-green-600 font-semibold">História atualizada com sucesso! Redirecionando...</div>
      )}
    </div>
  );
};

export default EditStoryPage;

    const router = useRouter();
    const params = useParams() as EditContentPageParams;
    const id = params.id;

    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [contentType, setContentType] = useState<string>(""); // "story" ou "chapter"
    const [category, setCategory] = useState<string>("");
    const [chapterNumber, setChapterNumber] = useState<number>(1);
    const [maxChapterNumber, setMaxChapterNumber] = useState<number>(1);
    const [seriesId, setSeriesId] = useState<string|null>(null);
    const [series, setSeries] = useState<any>(null);
    const [isPublished, setIsPublished] = useState<boolean>(false);
    const [originalIsPublished, setOriginalIsPublished] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string|null>(null);
    const [success, setSuccess] = useState<string|null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [formChanged, setFormChanged] = useState<boolean>(false);
    const [originalData, setOriginalData] = useState({
        title: "",
        content: "",
        category: "",
        chapter_number: 1,
    });
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [readingTime, setReadingTime] = useState<number>(0);
    const [lastSaved, setLastSaved] = useState<string>("");

    const supabase = createBrowserClient();

    // Lista de categorias disponíveis para histórias
    const categories = [
        "Fantasia",
        "Romance",
        "Terror",
        "LGBTQ+",
        "Humor",
        "Poesia",
        "Ficção Científica",
        "Brasileiro",
        "Outros",
    ];

    useEffect(() => {
        async function fetchContent() {
            // ... lógica de busca e tipagem
        }
        fetchContent();
    }, [id]);

    // ... resto do componente, garantindo tipagem
    return (
        <div>
            {/* Conteúdo do componente EditContentPage */}
        </div>
    );
}
