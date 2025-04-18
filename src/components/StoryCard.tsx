import React from 'react';
import { Story } from '../lib/storyTypes';
import { StoryBadge } from './StoryBadge';
import { StoryMetadata } from './StoryMetadata';

interface StoryCardProps {
  story: Story;
  chapterIndex?: number;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, chapterIndex }) => (
  <div className="relative bg-white border border-[#C4C4C4] px-4 py-6 rounded-lg shadow-sm mb-4">
    {/* Badge no topo direito */}
    <div className="absolute right-0 top-0">
      <StoryBadge type={story.type} />
    </div>
    {/* Título */}
    <h2 className="text-lg font-bold text-gray-900 mb-1">{story.title}</h2>
    {/* Subtítulo */}
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[#484DB5] font-semibold text-sm">
        {story.type === 'SERIES' && story.description ? `Série: ${story.description}` : 'Conto Único'}
      </span>
    </div>
    {/* Resumo/capítulo */}
    <p className="text-gray-700 text-sm mb-2">
      {story.chapters[chapterIndex ?? 0]?.content?.slice(0, 90) ?? ''}
      {story.chapters[chapterIndex ?? 0]?.content?.length > 90 ? '...' : ''}
    </p>
    {/* Metadados */}
    <StoryMetadata
      author={story.author}
      createdAt={story.createdAt}
      commentsCount={story.commentsCount}
    />
  </div>
);
