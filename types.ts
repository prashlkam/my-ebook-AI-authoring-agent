
export interface AuthorPersona {
  name: string;
  professionalHistory: string;
  writingStyle: string;
  coreWhy: string;
  personalStories: string;
  socialHandles: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  overview: string;
  content: string;
  summary: string; // Used for "Running Summary" context
  status: 'drafting' | 'review' | 'final' | 'flagged';
  pointers: string;
  plagiarismScore?: number; // 0-100, where 100 is high risk/high AI likeness
  plagiarismReport?: string;
}

export interface EbookProject {
  id: string;
  theme: string;
  title: string;
  subtitle: string;
  targetAudience: string;
  authorPersona: AuthorPersona;
  chapters: Chapter[];
  coverUrl?: string;
}

export enum AppTab {
  AUTHOR = 'author',
  RESEARCH = 'research',
  CHAPTERS = 'chapters',
  PUBLISH = 'publish'
}
