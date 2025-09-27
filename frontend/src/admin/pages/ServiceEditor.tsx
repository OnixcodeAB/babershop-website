import { useEffect, useMemo, useState } from 'react';
import type { Service } from '../../client/entities/service';
import { useAdminCategories } from '../hooks/useAdminCategories';
import { useToast } from '../ui/toast';

export type ServiceEditorProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<Service>;
  onClose: () => void;
  onSave: (values: Omit<Service, 'id'> & { id?: string; categoryIds?: string[] }) => Promise<void> | void;
};

type Draft = Omit<Service, 'id'> & { id?: string; categoryIds?: string[] };

export default function ServiceEditor({ open, mode, initial, onClose, onSave }: ServiceEditorProps) {
  const [draft, setDraft] = useState<Draft>({
    id: undefined,
    name: '',
    description: '',
    durationMinutes: 30,
    priceCents: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const categoriesQuery = useAdminCategories({ status: 'active', page: 1, pageSize: 100, sort: 'sortOrder' });
  const categories = categoriesQuery.data?.items ?? [];
  const { notify } = useToast();

  useEffect(() => {
    if (open) {
      setErrors({});
      setSaving(false);
      setDraft((prev) => ({
        ...prev,
        ...(initial as Draft),
        categoryIds: (initial as any)?.categories?.map?.((c: any) => c.id) ?? (prev.categoryIds ?? []),
      }));
    }
  }, [open, initial]);

  const validate = useMemo(() => {
    return () => {
      const next: Record<string, string> = {};
      if (!draft.name?.trim()) next.name = 'Name is required';
      if (draft.priceCents < 0) next.priceCents = 'Price must be >= 0';
      if (draft.durationMinutes <= 0) next.durationMinutes = 'Duration must be > 0';
      setErrors(next);
      return Object.keys(next).length === 0;
    };
  }, [draft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(draft);
      notify({ type: 'success', message: mode === 'create' ? 'Service created' : 'Service updated' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto border-l border-slate-800 bg-slate-950 p-6 text-slate-200">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white">{mode === 'create' ? 'New service' : 'Edit service'}</h3>
          <p className="text-sm text-slate-400">Basics, pricing and duration.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Description</label>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Price (USD)</label>
              <input
                type="number"
                min={0}
                value={(draft.priceCents / 100).toString()}
                onChange={(e) => setDraft((d) => ({ ...d, priceCents: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
              {errors.priceCents && <p className="mt-1 text-xs text-red-300">{errors.priceCents}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Duration (mins)</label>
              <input
                type="number"
                min={1}
                value={draft.durationMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, durationMinutes: Math.max(1, parseInt(e.target.value || '0', 10)) }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
              {errors.durationMinutes && <p className="mt-1 text-xs text-red-300">{errors.durationMinutes}</p>}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Category</label>
            {categoriesQuery.isLoading ? (
              <p className="text-xs text-slate-400">Loading categories…</p>
            ) : categories.length === 0 ? (
              <p className="text-xs text-slate-500">No categories yet.</p>
            ) : (
              <select
                value={(draft.categoryIds && draft.categoryIds[0]) ?? ((initial as any)?.categories?.[0]?.id ?? '')}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraft((d) => ({ ...d, categoryIds: value ? [value] : [] } as Draft));
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>

          <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-slate-800 bg-slate-950 pt-4">
            <button type="button" className="rounded-full border border-slate-800 px-4 py-2 text-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60" disabled={saving}>
              {saving ? 'Saving...' : mode === 'create' ? 'Save' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
