function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

import type { AppointmentConfirmation } from '../../entities/appointment';

export type BarberSelectionMode = 'unselected' | 'any' | 'specific';

export interface BookingState {
  serviceId: string | null;
  barberId: string | null;
  barberSelectionMode: BarberSelectionMode;
  date: string;
  slotId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  confirmation: AppointmentConfirmation | null;
}

export type BookingEvent =
  | { type: 'BOOKING_RESET' }
  | { type: 'SERVICE_SELECTED'; payload: { serviceId: string } }
  | { type: 'BARBER_ANY_SELECTED' }
  | { type: 'BARBER_SPECIFIC_SELECTED'; payload: { barberId: string } }
  | { type: 'BARBER_SELECTION_CLEARED' }
  | { type: 'DATE_SET'; payload: { date: string } }
  | { type: 'SLOT_SELECTED'; payload: { slotId: string | null; barberId?: string | null } }
  | { type: 'CLIENT_FIELD_CHANGED'; payload: { field: 'clientName' | 'clientEmail' | 'clientPhone' | 'notes'; value: string } }
  | { type: 'CONFIRMED'; payload: { confirmation: AppointmentConfirmation } }
  | { type: 'CONFIRMATION_CLEARED' };

export const initialBookingState: BookingState = {
  serviceId: null,
  barberId: null,
  barberSelectionMode: 'unselected',
  date: getTodayInputValue(),
  slotId: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  notes: '',
  confirmation: null,
};
