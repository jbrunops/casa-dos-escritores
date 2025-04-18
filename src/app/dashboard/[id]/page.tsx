import React from 'react';
import { useParams } from 'next/navigation';
import { useStoryStore } from '../../../lib/storyStore';
import { StoryCard } from '../../../components/StoryCard';

const StoryViewPage = () => {
  const params = useParams();
  const storyId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const story = useStoryStore((state) => state.stories.find(s => s.id === storyId));

  if (!story) {
    return <div className="container mx-auto px-4 py-8">História não encontrada.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <StoryCard story={story} />
      <div className="mt-8">
        {story.type === 'SERIES' ? (
          <div>
            <h3 className="text-lg font-bold mb-2">Capítulos</h3>
            <ul className="space-y-4">
              {story.chapters.map((chapter, idx) => (
                <li key={chapter.id} className="border border-[#C4C4C4] rounded px-4 py-3">
                  <div className="font-semibold text-[#484DB5] mb-1">Capítulo {idx + 1}: {chapter.title}</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">{chapter.content}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold mb-2">Capítulo Único</h3>
            <div className="border border-[#C4C4C4] rounded px-4 py-3">
              <div className="font-semibold text-[#484DB5] mb-1">{story.chapters[0]?.title}</div>
              <div className="text-sm text-gray-700 whitespace-pre-line">{story.chapters[0]?.content}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewPage;
