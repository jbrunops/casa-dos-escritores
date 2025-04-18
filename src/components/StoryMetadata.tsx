import React from 'react';
import { FaRegCommentDots } from 'react-icons/fa';

interface StoryMetadataProps {
  author: string;
  createdAt: string;
  commentsCount: number;
}

export const StoryMetadata: React.FC<StoryMetadataProps> = ({ author, createdAt, commentsCount }) => (
  <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
    <span>{author}</span>
    <span className="flex items-center gap-1">
      <FaRegCommentDots className="text-[#484DB5]" />
      {commentsCount}
    </span>
    <span>{new Date(createdAt).toLocaleDateString()}</span>
  </div>
);
