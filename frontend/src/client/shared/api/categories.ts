import type { Category } from '../../entities/category';
import { httpClient } from './http';

export async function fetchCategories(): Promise<Category[]> {
  const res = await httpClient.get<Category[]>('/categories');
  return res.data.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
}

