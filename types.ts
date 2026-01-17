export interface ArticleSummary {
  id: string;
  headline: string;
  subhead: string;
  summary: string;
  category: string;
  author: string;
}

export interface FullArticle extends ArticleSummary {
  content: string; // Markdown content
  date: string;
}

export enum AppView {
  SETUP = 'SETUP',
  FRONTPAGE = 'FRONTPAGE',
  ARTICLE = 'ARTICLE',
}

export interface GenerateConfig {
  topics: string;
  language?: string;
}