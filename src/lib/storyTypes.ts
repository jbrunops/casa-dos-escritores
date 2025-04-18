export type StoryType = 'SERIES' | 'SINGLE';

export interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Story {
  id: string;
  title: string;
  description?: string; // Nome da série, se aplicável
  type: StoryType;
  chapters: Chapter[];
  author: string;
  createdAt: string;
  commentsCount: number;
}
