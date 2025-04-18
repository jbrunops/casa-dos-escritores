import { create } from 'zustand';
import { Story } from '../lib/storyTypes';

interface StoryState {
  stories: Story[];
  addStory: (story: Story) => void;
  updateStory: (story: Story) => void;
  removeStory: (id: string) => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  stories: [],
  addStory: (story) => set((state) => ({ stories: [story, ...state.stories] })),
  updateStory: (story) => set((state) => ({
    stories: state.stories.map((s) => (s.id === story.id ? story : s)),
  })),
  removeStory: (id) => set((state) => ({
    stories: state.stories.filter((s) => s.id !== id),
  })),
}));
