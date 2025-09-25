import { httpClient } from '../../client/shared/api/http';
import type { AppointmentStatus } from '../../client/entities/appointment';

export interface AdminAppointment {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  notes: string | null;
  status: AppointmentStatus;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    priceCents: number;
    isActive: boolean;
  };
  barber: {
    id: string;
    name: string;
  } | null;
  slot: {
    id: string;
    start: string;
    end: string;
  };
}

export interface FetchAdminAppointmentsParams {
  status?: AppointmentStatus;
}

export async function fetchAdminAppointments(params: FetchAdminAppointmentsParams = {}): Promise<AdminAppointment[]> {
  const response = await httpClient.get<AdminAppointment[]>('/appointments', {
    params,
  });
  return response.data;
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<AdminAppointment> {
  const response = await httpClient.patch<AdminAppointment>(`/appointments/${appointmentId}/status`, { status });
  return response.data;
}