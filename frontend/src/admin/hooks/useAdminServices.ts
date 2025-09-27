import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Service } from '../../client/entities/service';
import { fetchAdminServices, createAdminService, updateAdminService, deleteAdminService, toggleAdminServiceActive } from '../api/services';

export type ServicesQueryParams = {
  query?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive';
  sort?: 'name' | 'price' | 'duration' | 'updatedAt';
  page?: number;
  pageSize?: number;
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

// NOTE: Uses public services fetch and applies client-side filtering/sorting/pagination.
export function useAdminServices(params: ServicesQueryParams = { page: 1, pageSize: 12, status: 'all' }) {
  const { query = '', status = 'all', sort = 'name', page = 1, pageSize = 12, category } = params;

  return useQuery<Paged<Service>, unknown>({
    queryKey: ['admin', 'services', { query, status, sort, page, pageSize, category }],
    queryFn: async () => {
      return await fetchAdminServices({ query, status, sort, page, pageSize, category });
    },
    placeholderData: (prev) => prev as any,
  });
}

// Optimistic client-side mutations; replace with real admin endpoints when backend is ready.
export function useToggleServiceActive(params: ServicesQueryParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; isActive: boolean }) => {
      await toggleAdminServiceActive(payload.id, payload.isActive);
      return payload;
    },
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'services'] });
      const allQueries = qc.getQueryCache().findAll({ queryKey: ['admin', 'services'] });
      const snapshots = allQueries.map((q) => ({ q, data: q.state.data }));
      allQueries.forEach((q) => {
        const data = q.state.data as Paged<Service> | undefined;
        if (!data) return;
        const nextItems = data.items.map((s) => (s.id === id ? { ...s, isActive } : s));
        qc.setQueryData(q.queryKey, { ...data, items: nextItems });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(({ q, data }) => q.setData(data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
  });
}

export function useDeleteService(params: ServicesQueryParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAdminService(id);
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'services'] });
      const allQueries = qc.getQueryCache().findAll({ queryKey: ['admin', 'services'] });
      const snapshots = allQueries.map((q) => ({ q, data: q.state.data }));
      allQueries.forEach((q) => {
        const data = q.state.data as Paged<Service> | undefined;
        if (!data) return;
        const nextItems = data.items.filter((s) => s.id !== id);
        qc.setQueryData(q.queryKey, { ...data, items: nextItems });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => ctx?.snapshots?.forEach(({ q, data }) => q.setData(data)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  });
}

export function useCreateService(params: ServicesQueryParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<Service, 'id'> & { id?: string }) => await createAdminService(service),
    onSuccess: (created) => {
      const key = ['admin', 'services', { query: params.query ?? '', status: params.status ?? 'all', sort: params.sort ?? 'name', page: params.page ?? 1, pageSize: params.pageSize ?? 12 }];
      const data = qc.getQueryData<Paged<Service>>(key);
      if (data) {
        const nextItems = [created as Service, ...data.items];
        const trimmed = nextItems.slice(0, data.pageSize);
        qc.setQueryData(key, { ...data, items: trimmed, total: data.total + 1 });
      }
    },
  });
}

export function useUpdateService(params: ServicesQueryParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (service: Service & { categoryIds?: string[] }) => await updateAdminService(service),
    onMutate: async (service) => {
      await qc.cancelQueries({ queryKey: ['admin', 'services'] });
      const allQueries = qc.getQueryCache().findAll({ queryKey: ['admin', 'services'] });
      const snapshots = allQueries.map((q) => ({ q, data: q.state.data }));
      allQueries.forEach((q) => {
        const data = q.state.data as Paged<Service> | undefined;
        if (!data) return;
        const nextItems = data.items.map((s) => (s.id === service.id ? { ...s, ...service } : s));
        qc.setQueryData(q.queryKey, { ...data, items: nextItems });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => ctx?.snapshots?.forEach(({ q, data }) => q.setData(data)),
    onSuccess: (updated) => {
      const allQueries = qc.getQueryCache().findAll({ queryKey: ['admin', 'services'] });
      allQueries.forEach((q) => {
        const data = q.state.data as Paged<Service> | undefined;
        if (!data) return;
        const nextItems = data.items.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
        qc.setQueryData(q.queryKey, { ...data, items: nextItems });
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  });
}
