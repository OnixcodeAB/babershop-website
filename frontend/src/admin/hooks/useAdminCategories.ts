import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdminCategory, deleteAdminCategory, fetchAdminCategories, updateAdminCategory, type AdminCategory, type CategoryListParams } from '../api/categories';

export function useAdminCategories(params: CategoryListParams = { status: 'all', page: 1, pageSize: 50, sort: 'sortOrder' }) {
  return useQuery<{ items: AdminCategory[]; total: number; page: number; pageSize: number }, unknown>({
    queryKey: ['admin', 'categories', params],
    queryFn: () => fetchAdminCategories(params),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug?: string }) => createAdminCategory(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<AdminCategory> }) => updateAdminCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

