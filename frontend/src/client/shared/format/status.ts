import type { AppointmentStatus } from '../../entities/appointment';

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function formatAppointmentStatus(status: AppointmentStatus): string {
  return statusLabels[status] ?? status;
}