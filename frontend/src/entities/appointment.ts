import type { Service } from './service';
import type { Barber } from './barber';
import type { AvailabilitySlot } from './slot';

export type AppointmentId = string;

export type AppointmentConfirmation = {
  id: AppointmentId;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  notes: string | null;
  status: string;
  service: Service;
  barber: Barber | null;
  slot: AvailabilitySlot & { dateLabel?: string };
};
