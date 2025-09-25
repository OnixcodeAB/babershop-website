import { ReactNode } from 'react';

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900 bg-slate-950/80 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-lg font-semibold text-white">BarberShop Admin</h1>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Dashboard · Coming soon</p>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-6 py-20">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AdminApp() {
  return (
    <AdminLayout>
      <p className="text-sm text-slate-300">
        The admin dashboard is under construction. Stay tuned for appointment management, analytics, and more tools to
        keep the shop humming.
      </p>
    </AdminLayout>
  );
}

export default AdminApp;
