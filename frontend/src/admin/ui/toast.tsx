import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Toast = { id: string; type: 'success' | 'error' | 'info'; message: string };

const ToastCtx = createContext<null | { notify: (t: Omit<Toast, 'id'>) => void }>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastHost />');
  return ctx;
}

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const api = useMemo(() => ({
    notify: (t: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random());
      const toast = { id, ...t };
      setItems((prev) => [...prev, toast]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3000);
    },
  }), []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[320px] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-md border px-3 py-2 text-sm ${t.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : t.type === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-slate-700 bg-slate-800/80 text-slate-200'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
