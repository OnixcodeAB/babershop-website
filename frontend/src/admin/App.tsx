import { ReactNode, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  Home,
  CalendarCheck2,
  Scissors,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Bell,
  Pencil,
  Trash2,
} from "lucide-react";
import type { AppointmentStatus } from "../client/entities/appointment";
import { formatAppointmentStatus } from "../client/shared/format";
import { formatDateTime } from "../client/shared/format/date";
import { logoutAdmin, type AdminSessionResponse } from "./api/session";
import { useAdminSession } from "./hooks/useAdminSession";
import {
  useAdminAppointments,
  useUpdateAppointmentStatus,
} from "./hooks/useAdminAppointments";
import ServicesPage from "./pages/ServicesPage";

interface AdminOutletContext {
  user: AdminSessionResponse["user"];
}

const NAV_ITEMS: Array<{ label: string; icon: ReactNode; to: string }> = [
  { label: "Dashboard", icon: <Home className="h-5 w-5" />, to: "/admin" },
  {
    label: "Bookings",
    icon: <CalendarCheck2 className="h-5 w-5" />,
    to: "/admin/appointments",
  },
  {
    label: "Services",
    icon: <Scissors className="h-5 w-5" />,
    to: "/admin/services",
  },
  {
    label: "Clients",
    icon: <Users className="h-5 w-5" />,
    to: "/admin/clients",
  },
  { label: "Staff", icon: <UserCog className="h-5 w-5" />, to: "/admin/staff" },
  {
    label: "Reports",
    icon: <BarChart3 className="h-5 w-5" />,
    to: "/admin/reports",
  },
  {
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    to: "/admin/settings",
  },
];

const KPI_CARDS = [
  {
    title: "Total clients",
    value: "1,842",
    trend: "+12.4% vs last month",
    positive: true,
    data: [65, 68, 72, 75, 80, 86, 92],
  },
  {
    title: "Total services",
    value: "36",
    trend: "+5.1% new",
    positive: true,
    data: [40, 44, 48, 53, 57, 61, 65],
  },
  {
    title: "Total employees",
    value: "18",
    trend: "+1 onboarded",
    positive: true,
    data: [55, 56, 58, 59, 60, 62, 64],
  },
  {
    title: "Churn risk",
    value: "7.4%",
    trend: "-2.1% vs last week",
    positive: false,
    data: [70, 68, 65, 63, 61, 59, 57],
  },
];

const VISITORS_DATA = [320, 360, 340, 420, 460, 510, 580];
const REVENUE_DATA = [7.5, 8.2, 9.1, 11.3, 10.4, 12.6, 13.8];

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const BOOKING_TABS: Array<{
  id: "upcoming" | "all" | "cancelled";
  label: string;
  status?: AppointmentStatus;
}> = [
  { id: "upcoming", label: "Upcoming bookings", status: "CONFIRMED" },
  { id: "all", label: "All bookings" },
  { id: "cancelled", label: "Cancelled bookings", status: "CANCELLED" },
];

function AdminGuard() {
  const { data, status, error } = useAdminSession();

  if (status === "pending") {
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

function Avatar({ email }: { email: string }) {
  const letter = email.charAt(0).toUpperCase();
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-200">
      {letter}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const normalized = ((value - min) / range) * 100;
      const y = 100 - normalized;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-12 w-full">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function LineChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const normalized = ((value - min) / range) * 100;
      const y = 100 - normalized;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-48 w-full">
      <defs>
        <linearGradient id="visitors-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
          <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
        </linearGradient>
      </defs>
      <polyline
        fill="url(#visitors-gradient)"
        stroke="rgba(16, 185, 129, 0.6)"
        strokeWidth="3"
        points={`0,100 ${points} 100,100`}
      />
    </svg>
  );
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((value, index) => (
        <div key={index} className="flex-1 rounded-t-md bg-emerald-500/20">
          <div
            className="rounded-t-md bg-emerald-400"
            style={{ height: `${(value / max) * 100}%` }}
            title={`$${value.toFixed(1)}k`}
          />
        </div>
      ))}
    </div>
  );
}

function AdminLayout() {
  const { user } = useAdminOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["admin", "session"] });
      navigate("/admin/login", { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-lg text-emerald-300">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                BarberShop
              </p>
              <h1 className="text-lg font-semibold text-white">
                Admin dashboard
              </h1>
            </div>
          </div>
          <div className="relative hidden flex-1 items-center md:flex">
            <svg
              className="absolute left-3 h-4 w-4 text-slate-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M13.535 14.95a8 8 0 111.414-1.414l3.258 3.257a1 1 0 01-1.414 1.415l-3.258-3.258zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="search"
              placeholder="Search bookings, clients or services"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:text-emerald-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </button>
            <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5">
              <Avatar email={user.email} />
              <div className="hidden text-sm text-slate-300 sm:block">
                <p className="font-semibold text-white">Admin</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.2em] text-emerald-300 hover:text-emerald-200"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-10 lg:grid lg:grid-cols-[5rem_1fr] lg:gap-6">
        <aside
          className="w-full rounded-xl border border-slate-900 bg-slate-900/60 p-3 text-slate-300
      lg:col-start-1 lg:row-start-1
      lg:w-auto lg:p-4
      lg:sticky lg:top-20            
      lg:h-[calc(100vh-5rem)]        
      lg:overflow-y-auto
      lg:shrink-0
      self-start
      z-10    "
        >
          <div className="flex flex-row gap-2 lg:flex-col lg:items-center lg:gap-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-12 w-12 items-center justify-center rounded-xl text-xl transition hover:bg-slate-800/80 hover:text-emerald-200 ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "text-slate-400"
                  }`
                }
                title={item.label}
              >
                {item.icon}
              </NavLink>
            ))}
          </div>
        </aside>
        <main className="mt-6 lg:mt-0 lg:col-start-2 lg:row-start-1 flex-1 space-y-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CARDS.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-slate-900 bg-slate-900/60 p-5"
        >
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {card.title}
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {card.value}
          </div>
          <div
            className={`mt-2 text-xs ${
              card.positive ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {card.trend}
          </div>
          <div className="mt-4">
            <Sparkline
              data={card.data}
              color={
                card.positive
                  ? "rgba(16, 185, 129, 0.8)"
                  : "rgba(239, 68, 68, 0.8)"
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 rounded-xl border border-slate-900 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Total visitors</h3>
            <p className="text-sm text-slate-400">Website traffic (sessions)</p>
          </div>
          <button className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            This month
          </button>
        </div>
        <LineChart data={VISITORS_DATA} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-900 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Revenue</h3>
              <p className="text-sm text-slate-400">Weekly revenue (k$)</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
              +82% lift
            </span>
          </div>
          <BarChart data={REVENUE_DATA} />
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm text-emerald-200">
          <p className="text-xs uppercase tracking-[0.3em]">Highlights</p>
          <h4 className="mt-4 text-lg font-semibold text-white">
            VIP memberships up 23%
          </h4>
          <p className="mt-2 text-emerald-100/80">
            Members are booking repeat visits faster than expected. Consider
            expanding prime-time slots.
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="space-y-6">
      <KpiCards />
      <AnalyticsSection />
    </div>
  );
}

function AppointmentsView() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "all" | "cancelled">(
    "upcoming"
  );
  const selectedStatus = BOOKING_TABS.find(
    (tab) => tab.id === activeTab
  )?.status;
  const { data, status, error } = useAdminAppointments(selectedStatus);
  const updateStatus = useUpdateAppointmentStatus();

  const appointments = data ?? [];

  const statusBadgeClasses: Record<AppointmentStatus, string> = {
    PENDING: "bg-amber-500/20 text-amber-200",
    CONFIRMED: "bg-emerald-500/20 text-emerald-200",
    IN_PROGRESS: "bg-blue-500/20 text-blue-200",
    COMPLETED: "bg-slate-500/20 text-slate-200",
    CANCELLED: "bg-red-500/20 text-red-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Bookings</h2>
          <p className="text-sm text-slate-400">
            Monitor bookings, track progress, and keep the team aligned.
          </p>
        </div>
        <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
          Add service
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {BOOKING_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
              activeTab === tab.id
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                : "border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === "pending" ? (
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
                <th className="px-4 py-3">Start time</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/80">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm text-emerald-200">
                        {appointment.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {appointment.clientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {appointment.clientEmail ?? "No email"}
                          {" • "}

                          {appointment.clientPhone ?? "No phone"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-white">
                      {appointment.service.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {appointment.source ?? "web booking"}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div>{formatDateTime(appointment.slot.start)}</div>
                    <div className="text-xs text-slate-500">
                      Created {formatDateTime(appointment.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {appointment.barber ? (
                      <span className="text-sm text-slate-300">
                        {appointment.barber.name}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                        statusBadgeClasses[appointment.status]
                      }`}
                    >
                      {formatAppointmentStatus(appointment.status)}
                    </span>
                  </td>
                  <td className="px-4  align-top">
                    <div className="flex items-center justify-end gap-3 text-lg">
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          updateStatus.mutate({
                            id: appointment.id,
                            status: event.target.value as AppointmentStatus,
                          })
                        }
                        className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        disabled={updateStatus.isPending}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-emerald-200"
                        aria-label="Edit booking"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-300"
                        aria-label="Cancel booking"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
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
        Use this space soon to manage barber profiles, availability, and
        specialties. Stay tuned.
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
          <Route path="services" element={<ServicesPage />} />
          <Route path="barbers" element={<BarbersPlaceholder />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
