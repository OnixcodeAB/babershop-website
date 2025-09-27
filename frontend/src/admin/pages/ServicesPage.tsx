import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Service } from '../../client/entities/service';
import { useAdminServices, type ServicesQueryParams, useToggleServiceActive, useDeleteService, useCreateService, useUpdateService } from '../hooks/useAdminServices';
import { useAdminCategories } from '../hooks/useAdminCategories';
import ServiceEditor from './ServiceEditor';
import ConfirmDialog from './ConfirmDialog';
import { useSearchParams } from 'react-router-dom';
import CategoryManager from './CategoryManager';
import { useToast } from '../ui/toast';

function PageHeader({ onNew, onManageCategories }: { onNew: () => void; onManageCategories: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 id="services-heading" className="text-2xl font-semibold text-white">
          Services
        </h2>
        <p className="text-sm text-slate-400">Manage catalog, pricing, and availability.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
          onClick={onManageCategories}
        >
          Categories
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
        >
          Export
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          onClick={onNew}
        >
          <Plus className="h-4 w-4" /> New service
        </button>
      </div>
    </div>
  );
}

function ServicesToolbar(props: {
  query: string;
  status: 'all' | 'active' | 'inactive';
  category: string | 'all';
  view: 'grid' | 'list';
  onChange: (next: Partial<Pick<ServicesQueryParams, 'query' | 'status' | 'category'>> & { view?: 'grid' | 'list' }) => void;
}) {
  const { query, status, category, view, onChange } = props;
  const cats = useAdminCategories({ status: 'active', page: 1, pageSize: 100, sort: 'sortOrder' });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M13.535 14.95a8 8 0 111.414-1.414l3.258 3.257a1 1 0 01-1.414 1.415l-3.258-3.258zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
        </svg>
        <input
          value={query}
          onChange={(e) => onChange({ query: e.target.value })}
          type="search"
          placeholder="Search services"
          className="w-72 rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onChange({ status: e.target.value as 'all' | 'active' | 'inactive' })}
        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select
        value={category}
        onChange={(e) => onChange({ category: e.target.value === 'all' ? undefined : e.target.value })}
        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
      >
        <option value="all">All categories</option>
        {(cats.data?.items ?? []).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => onChange({ view: 'grid' })}
          className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.2em] ${view === 'grid' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200' : 'border-slate-800 text-slate-400'}`}
        >
          Grid
        </button>
        <button
          onClick={() => onChange({ view: 'list' })}
          className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.2em] ${view === 'list' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200' : 'border-slate-800 text-slate-400'}`}
        >
          List
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-slate-900 bg-slate-900/40 p-12 text-center text-slate-300">
      <div>
        <div className="text-2xl font-semibold text-white">Add your first service</div>
        <p className="mt-2 text-sm text-slate-400">Create a service to start managing your catalog.</p>
        <button
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> New service
        </button>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white">{service.name}</div>
          <div className="mt-1 text-xs text-slate-500 line-clamp-2">
            {service.description ?? 'No description'}
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${service.isActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700/40 text-slate-300'}`}>{service.isActive ? 'Active' : 'Inactive'}</span>
      </div>
      <div className="mt-3 text-sm text-slate-300">
        <span className="rounded-full border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs">{Math.round(service.durationMinutes)} mins</span>
        <span className="ml-2 rounded-full border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs">${(service.priceCents / 100).toFixed(2)}</span>
      </div>
    </div>
  );
}

function ServiceCollection({ items, variant, onEdit, onToggleActive, onDelete }: { items: Service[]; variant: 'grid' | 'list'; onEdit: (s: Service) => void; onToggleActive: (s: Service) => void; onDelete: (s: Service) => void; }) {
  if (variant === 'list') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-900 text-left text-sm text-slate-200">
          <thead className="bg-slate-900/60 text-xs uppercase tracking-[0.25em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-900/40">
                <td className="px-4 py-3 text-white">{s.name}</td>
                <td className="px-4 py-3">${(s.priceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{s.durationMinutes} mins</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${s.isActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700/40 text-slate-300'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 text-slate-400">
                    <button className="hover:text-emerald-200" onClick={() => onEdit(s)} aria-label="Edit"><Pencil className="h-5 w-5" /></button>
                    <button className="hover:text-slate-200" onClick={() => onToggleActive(s)} aria-label="Toggle active"><MoreHorizontal className="h-5 w-5" /></button>
                    <button className="hover:text-red-300" onClick={() => onDelete(s)} aria-label="Delete"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  // grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((s) => (
        <div key={s.id} className="group relative">
          
          <ServiceCard service={s} />
          <div className="absolute right-3 top-3 hidden gap-2 group-hover:flex">
            <button className="rounded-full border border-slate-800 bg-slate-950/80 p-1 text-slate-300 hover:text-emerald-200" onClick={() => onEdit(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
            <button className="rounded-full border border-slate-800 bg-slate-950/80 p-1 text-slate-300 hover:text-slate-100" onClick={() => onToggleActive(s)} aria-label="Toggle active"><MoreHorizontal className="h-4 w-4" /></button>
            <button className="rounded-full border border-slate-800 bg-slate-950/80 p-1 text-slate-300 hover:text-red-300" onClick={() => onDelete(s)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(() => {
    const s = searchParams.get('status');
    return s === 'active' || s === 'inactive' ? s : 'all';
  });
  const [view, setView] = useState<'grid' | 'list'>(() => (searchParams.get('view') === 'list' ? 'list' : 'grid'));
  const [category, setCategory] = useState<string | 'all'>(() => searchParams.get('category') ?? 'all');
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10)));
  const [pageSize, setPageSize] = useState(() => {
    const size = parseInt(searchParams.get('size') || '12', 10);
    return [12, 24, 48].includes(size) ? size : 12;
  });

  const params: ServicesQueryParams = { query, status: statusFilter, page, pageSize, category: category !== 'all' ? category : undefined };
  const queryResult = useAdminServices(params);
  const { data, isPending, error } = queryResult as { data?: { items: Service[]; total: number; page: number; pageSize: number }; isPending: boolean; error: unknown };
  const paged = (data as { items: Service[]; total: number; page: number; pageSize: number }) ?? { items: [], total: 0, page, pageSize };

  const toggleActive = useToggleServiceActive(params);
  const deleteService = useDeleteService(params);
  const createService = useCreateService(params);
  const updateService = useUpdateService(params);

  const totalPages = Math.max(1, Math.ceil(paged.total / paged.pageSize));

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorInitial, setEditorInitial] = useState<Partial<Service> | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { notify } = useToast();

  // URL sync
  useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    sp.set('status', statusFilter);
    sp.set('view', view);
    sp.set('page', String(page));
    sp.set('size', String(pageSize));
    if (category && category !== 'all') sp.set('category', category);
    setSearchParams(sp, { replace: true });
  }, [query, statusFilter, view, page, pageSize, category, setSearchParams]);

  return (
    <section role="region" aria-labelledby="services-heading" className="space-y-4">
      <PageHeader onNew={() => { setEditorMode('create'); setEditorInitial(undefined); setEditorOpen(true); }} onManageCategories={() => setCategoriesOpen(true)} />
      <ServicesToolbar
        query={query}
        status={statusFilter}
        category={category}
        view={view}
        onChange={(next) => {
          if (typeof next.query !== 'undefined') { setQuery(next.query); setPage(1); }
          if (typeof next.status !== 'undefined') { setStatusFilter(next.status); setPage(1); }
          if (typeof next.category !== 'undefined') { setCategory((next.category as any) ?? 'all'); setPage(1); }
          if (next.view) setView(next.view);
        }}
      />

      {isPending ? (
        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 text-sm text-slate-400">Loading services...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">Something went wrong while loading services.</div>
      ) : paged.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ServiceCollection
            items={paged.items}
            variant={view}
            onEdit={(s) => {
              setEditorMode('edit');
              setEditorInitial(s);
              setEditorOpen(true);
            }}
            onToggleActive={(s) => toggleActive.mutate(
              { id: s.id, isActive: !s.isActive },
              { onSuccess: () => notify({ type: 'success', message: 'Status updated' }), onError: () => notify({ type: 'error', message: 'Failed to update status' }) },
            )}
            onDelete={(s) => { setToDelete(s); setConfirmOpen(true); }}
          />
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400">Page {page} of {totalPages} • {paged.total} total</div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-slate-800 px-3 py-1.5 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                <button className="rounded-full border border-slate-800 px-3 py-1.5 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
              </div>
            </div>
          </div>
        </>
      )}

      <ServiceEditor
        open={editorOpen}
        mode={editorMode}
        initial={editorInitial}
        onClose={() => setEditorOpen(false)}
        onSave={async (values) => {
          const minimal = {
            name: values.name,
            description: values.description ?? null,
            durationMinutes: values.durationMinutes,
            priceCents: values.priceCents,
            isActive: values.isActive,
            categoryIds: values.categoryIds ?? [],
          };
          if (editorMode === 'create') {
            await createService.mutateAsync(minimal as any);
          } else if (editorInitial && editorInitial.id) {
            await updateService.mutateAsync({ ...(minimal as any), id: editorInitial.id } as any);
          }
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={toDelete ? `Delete “${toDelete.name}”?` : 'Delete service'}
        description={toDelete ? `You’re about to delete ${toDelete.name}. Existing bookings aren’t affected.` : undefined}
        confirmLabel="Delete"
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={() => {
          if (toDelete) deleteService.mutate(toDelete.id, { onSuccess: () => notify({ type: 'success', message: 'Service deleted' }), onError: () => notify({ type: 'error', message: 'Failed to delete service' }) });
          setConfirmOpen(false);
          setToDelete(null);
        }}
      />
      <CategoryManager open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </section>
  );
}


