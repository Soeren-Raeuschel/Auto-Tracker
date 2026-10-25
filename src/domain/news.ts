export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO date
  summary?: string; // own short summary, never full text
  carIds: string[]; // matched cars
}
