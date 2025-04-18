import React from 'react';
import { StoryType } from '../lib/storyTypes';

interface StoryBadgeProps {
  type: StoryType;
}

const badgeText = {
  SINGLE: 'Conto Único',
  SERIES: 'Série',
};

export const StoryBadge: React.FC<StoryBadgeProps> = ({ type }) => (
  <span
    className="px-4 py-1 rounded-bl-lg rounded-br-lg bg-[#484DB5] text-white text-sm font-semibold shadow absolute right-0 top-0"
    data-testid="story-badge"
  >
    {badgeText[type]}
  </span>
);
