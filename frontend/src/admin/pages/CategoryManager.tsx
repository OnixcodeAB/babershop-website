import { useState } from 'react';
import { useAdminCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../hooks/useAdminCategories';

export default function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useAdminCategories({ status: 'all', page: 1, pageSize: 100, sort: 'sortOrder' });
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const [name, setName] = useState('');

  if (!open) return null;
  const items = data?.items ?? [];

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Manage Categories</h3>
          <button className="text-sm text-slate-400 hover:text-slate-200" onClick={onClose}>Close</button>
        </div>
        <div className="mb-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            onClick={() => name.trim() && createCat.mutate({ name })}
            disabled={createCat.isPending || !name.trim()}
          >
            Add
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">No categories yet.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.25em] text-slate-500">
                <tr>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Sort</th>
                  <th className="px-2 py-2">Active</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-900/60">
                    <td className="px-2 py-2">
                      <input
                        defaultValue={c.name}
                        className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-white"
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value && value !== c.name) updateCat.mutate({ id: c.id, body: { name: value } });
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        defaultValue={c.sortOrder}
                        className="w-24 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-white"
                        onBlur={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          if (value !== c.sortOrder) updateCat.mutate({ id: c.id, body: { sortOrder: value } });
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        defaultChecked={c.isActive}
                        onChange={(e) => updateCat.mutate({ id: c.id, body: { isActive: e.target.checked } })}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button className="text-red-300 hover:text-red-200" onClick={() => deleteCat.mutate(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

