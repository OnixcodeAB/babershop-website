import { httpClient } from '../../client/shared/api/http';

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt?: string;
};

export type CategoryListParams = {
  query?: string;
  status?: 'all' | 'active' | 'inactive';
  sort?: 'name' | 'sortOrder' | 'updatedAt';
  page?: number;
  pageSize?: number;
};

export async function fetchAdminCategories(params: CategoryListParams = {}) {
  const res = await httpClient.get<{ items: AdminCategory[]; total: number; page: number; pageSize: number }>(
    '/admin/categories',
    { params },
  );
  return res.data;
}

export async function createAdminCategory(body: Partial<AdminCategory> & { name: string; slug?: string }) {
  const res = await httpClient.post<AdminCategory>('/admin/categories', body);
  return res.data;
}

export async function updateAdminCategory(id: string, body: Partial<AdminCategory>) {
  const res = await httpClient.patch<AdminCategory>(`/admin/categories/${id}`, body);
  return res.data;
}

export async function deleteAdminCategory(id: string) {
  await httpClient.delete(`/admin/categories/${id}`);
}

