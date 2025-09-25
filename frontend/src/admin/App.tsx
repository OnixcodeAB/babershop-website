import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import { logoutAdmin, type AdminSessionResponse } from './api/session';
import { useAdminSession } from './hooks/useAdminSession';

interface AdminOutletContext {
  user: AdminSessionResponse['user'];
}

function AdminGuard() {
  const { data, status, error } = useAdminSession();

  if (status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-400">Checking admin session...</p>
      </div>
    );
  }

  if (error) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!data) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet context={{ user: data.user }} />;
}

function useAdminOutletContext() {
  return useOutletContext<AdminOutletContext>();
}

function AdminLayout() {
  const { user } = useAdminOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['admin', 'session'] });
      navigate('/admin/login', { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">BarberShop</p>
            <h1 className="text-lg font-semibold text-white">Admin dashboard</h1>
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>{user.email}</p>
            <button
              type="button"
              className="mt-1 text-xs uppercase tracking-[0.25em] text-emerald-300 hover:text-emerald-200"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row">
        <aside className="w-full rounded-xl border border-slate-900 bg-slate-900/40 p-4 text-sm text-slate-300 lg:w-64">
          <nav className="flex flex-col gap-2">
            <NavLink
              end
              to="/admin"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive ? 'bg-emerald-500/20 text-emerald-200' : 'hover:bg-slate-900 text-slate-300'
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/admin/appointments"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive ? 'bg-emerald-500/20 text-emerald-200' : 'hover:bg-slate-900 text-slate-300'
                }`
              }
            >
              Appointments
            </NavLink>
            <NavLink
              to="/admin/barbers"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive ? 'bg-emerald-500/20 text-emerald-200' : 'hover:bg-slate-900 text-slate-300'
                }`
              }
            >
              Barbers
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-8 text-slate-200">
      <h2 className="text-2xl font-semibold text-white">Overview</h2>
      <p className="mt-3 text-sm text-slate-400">
        Analytics and quick actions will appear here. For now, everything is plugged in and ready for the upcoming
        dashboard work.
      </p>
    </div>
  );
}

function AppointmentsPlaceholder() {
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-8 text-slate-200">
      <h2 className="text-2xl font-semibold text-white">Appointments</h2>
      <p className="mt-3 text-sm text-slate-400">
        Appointment management tools will ship in the next iteration. Expect filters, status updates, and quick
        customer lookup.
      </p>
    </div>
  );
}

function BarbersPlaceholder() {
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-8 text-slate-200">
      <h2 className="text-2xl font-semibold text-white">Barbers</h2>
      <p className="mt-3 text-sm text-slate-400">
        Use this space soon to manage barber profiles, availability, and specialties. Stay tuned.
      </p>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="appointments" element={<AppointmentsPlaceholder />} />
          <Route path="barbers" element={<BarbersPlaceholder />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
