import type { NewsItem } from '../domain/news';

export interface NewsRepository {
  list(): Promise<NewsItem[]>;
}
