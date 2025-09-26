import { useState } from 'react';
import { useAdminCategories } from '../hooks/useAdminCategories';
import { useUpdateService } from '../hooks/useAdminServices';
import type { Service } from '../../client/entities/service';

export default function AssignCategoryDialog({ open, onClose, selected, services }: { open: boolean; onClose: () => void; selected: string[]; services: Service[] }) {
  const cats = useAdminCategories({ status: 'active', page: 1, pageSize: 100, sort: 'sortOrder' });
  const [categoryId, setCategoryId] = useState<string>('');
  const updateService = useUpdateService({});

  if (!open) return null;
  const items = cats.data?.items ?? [];

  const apply = async () => {
    const target = items.find((c) => c.id === categoryId);
    if (!target) return;
    const currentMap = new Map(services.map((s) => [s.id, s] as const));
    await Promise.all(
      selected.map(async (id) => {
        const svc = currentMap.get(id);
        if (!svc) return;
        const existing = (svc.categories ?? []).map((c) => c.id);
        const next = Array.from(new Set([...existing, categoryId]));
        await updateService.mutateAsync({ ...(svc as any), categoryIds: next });
      }),
    );
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-200">
        <h3 className="text-lg font-semibold text-white">Assign Category</h3>
        <p className="mt-2 text-sm text-slate-400">Selected: {selected.length} services</p>
        <div className="mt-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Choose a category</option>
            {items.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-slate-800 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60" disabled={!categoryId} onClick={apply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

