import type { Service } from './service';
import type { Barber } from './barber';
import type { AvailabilitySlot } from './slot';

export type AppointmentId = string;

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type AppointmentConfirmation = {
  id: AppointmentId;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  notes: string | null;
  status: AppointmentStatus;
  service: Service;
  barber: Barber | null;
  slot: AvailabilitySlot & { dateLabel?: string };
};
