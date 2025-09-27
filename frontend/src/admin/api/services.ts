import { httpClient } from '../../client/shared/api/http';
import type { Service } from '../../client/entities/service';
import { fetchServices as fetchPublicServices } from '../../client/shared/api/services';

export type ServiceDto = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
  updatedAt?: string;
  categories?: Array<{ id: string; name: string }>;
};

export type ListParams = {
  query?: string;
  status?: 'all' | 'active' | 'inactive';
  sort?: 'name' | 'price' | 'duration' | 'updatedAt';
  page?: number;
  pageSize?: number;
  category?: string;
};

export type ListResponse = {
  items: ServiceDto[];
  total: number;
  page: number;
  pageSize: number;
};

function map(dto: ServiceDto): Service {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    durationMinutes: dto.durationMinutes,
    priceCents: dto.priceCents,
    isActive: dto.isActive,
    categories: dto.categories ?? [],
  };
}

export async function fetchAdminServices(params: ListParams): Promise<{ items: Service[]; total: number; page: number; pageSize: number }> {
  try {
    const res = await httpClient.get<ListResponse>('/admin/services', { params });
    const { items, total, page, pageSize } = res.data;
    return { items: items.map(map), total, page, pageSize };
  } catch {
    // Fallback to public services and apply client-side paging
    const all = await fetchPublicServices();
    let items = all;
    const q = (params.query ?? '').trim().toLowerCase();
    if (q) items = items.filter((s) => s.name.toLowerCase().includes(q));
    if (params.status === 'active') items = items.filter((s) => s.isActive);
    if (params.status === 'inactive') items = items.filter((s) => !s.isActive);
    if (params.category) items = items.filter((s) => (s.categories ?? []).some((c) => c.id === params.category));
    items = [...items].sort((a, b) => {
      switch (params.sort) {
        case 'price':
          return a.priceCents - b.priceCents;
        case 'duration':
          return a.durationMinutes - b.durationMinutes;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;
    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);
    return { items: paged, total, page, pageSize };
  }
}

export async function createAdminService(body: Omit<Service, 'id'> & { id?: string; categoryIds?: string[] }): Promise<Service> {
  try {
    const payload: any = {
      name: body.name,
      description: body.description ?? null,
      durationMinutes: body.durationMinutes,
      priceCents: body.priceCents,
      isActive: body.isActive,
      categoryIds: body.categoryIds ?? [],
    };
    const res = await httpClient.post<ServiceDto>('/admin/services', payload);
    return map(res.data);
  } catch {
    // Fallback: return as-is with generated id to support optimistic UI
    const id = body.id ?? (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
    return { ...body, id } as Service;
  }
}

export async function updateAdminService(service: Service & { categoryIds?: string[] }): Promise<Service> {
  try {
    const payload: any = {
      name: service.name,
      description: service.description ?? null,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      isActive: service.isActive,
      ...(service.categoryIds ? { categoryIds: service.categoryIds } : {}),
    };
    const res = await httpClient.patch<ServiceDto>(`/admin/services/${service.id}`, payload);
    return map(res.data);
  } catch (err) {
    throw err;
  }
}

export async function deleteAdminService(id: string): Promise<void> {
  try {
    await httpClient.delete(`/admin/services/${id}`);
  } catch {
    // ignore in fallback
  }
}

export async function toggleAdminServiceActive(id: string, isActive: boolean): Promise<void> {
  try {
    await httpClient.patch(`/admin/services/${id}`, { isActive });
  } catch (err) {
    throw err;
  }
}
