import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import type { AppointmentStatus } from '../client/entities/appointment';
import { formatDateTime } from '../client/shared/format/date';
import { logoutAdmin, type AdminSessionResponse } from './api/session';
import { useAdminSession } from './hooks/useAdminSession';
import { useAdminAppointments, useUpdateAppointmentStatus } from './hooks/useAdminAppointments';

interface AdminOutletContext {
  user: AdminSessionResponse['user'];
}

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatStatus(status: AppointmentStatus) {
  const match = statusOptions.find((option) => option.value === status);
  return match ? match.label : status;
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

  if (error || !data) {
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

function AppointmentsView() {
  const [filter, setFilter] = useState<'all' | AppointmentStatus>('all');
  const { data, status, error } = useAdminAppointments(filter === 'all' ? undefined : filter);
  const updateStatus = useUpdateAppointmentStatus();

  const appointments = data ?? [];
  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All statuses' }, ...statusOptions],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Appointments</h2>
          <p className="text-sm text-slate-400">Track bookings and update their status as clients arrive.</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.25em] text-slate-400" htmlFor="appointment-status-filter">
            Filter by status
          </label>
          <select
            id="appointment-status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as 'all' | AppointmentStatus)}
            className="mt-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'pending' ? (
        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 text-sm text-slate-400">
          Loading appointments...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
          Something went wrong while loading appointments.
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 text-sm text-slate-400">
          No appointments to display.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/40">
          <table className="min-w-full divide-y divide-slate-900 text-left text-sm text-slate-200">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-[0.25em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/80">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-white">{appointment.clientName}</div>
                    <div className="text-xs text-slate-500">
                      {appointment.clientEmail ?? 'No email'} Ã‚Â· {appointment.clientPhone ?? 'No phone'}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{appointment.service.name}</div>
                    {appointment.barber ? (
                      <div className="text-xs text-slate-500">with {appointment.barber.name}</div>
                    ) : (
                      <div className="text-xs text-slate-500">Barber pending</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{formatDateTime(appointment.slot.start)}</div>
                    <div className="text-xs text-slate-500">Created {formatDateTime(appointment.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                      {formatStatus(appointment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={appointment.status}
                      onChange={(event) =>
                        updateStatus.mutate({ id: appointment.id, status: event.target.value as AppointmentStatus })
                      }
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      disabled={updateStatus.isPending}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
          <Route path="appointments" element={<AppointmentsView />} />
          <Route path="barbers" element={<BarbersPlaceholder />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
