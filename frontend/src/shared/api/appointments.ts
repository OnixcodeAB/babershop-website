import type { AppointmentConfirmation } from '../../entities/appointment';
import type { Service } from '../../entities/service';
import type { Barber } from '../../entities/barber';
import type { AvailabilitySlot } from '../../entities/slot';
import { httpClient } from './http';

export type AppointmentConfirmationDto = {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  notes: string | null;
  status: string;
  service: Service;
  barber: Barber | null;
  slot: AvailabilitySlot;
};

export interface CreateAppointmentPayload {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  serviceId: string;
  slotId: string;
}

function mapAppointment(dto: AppointmentConfirmationDto): AppointmentConfirmation {
  return {
    id: dto.id,
    clientName: dto.clientName,
    clientEmail: dto.clientEmail,
    clientPhone: dto.clientPhone,
    notes: dto.notes,
    status: dto.status,
    service: dto.service,
    barber: dto.barber,
    slot: dto.slot,
  };
}

export async function fetchAppointmentById(reference: string): Promise<AppointmentConfirmation> {
  const response = await httpClient.get<AppointmentConfirmationDto>(`/appointments/${reference}`);
  return mapAppointment(response.data);
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentConfirmation> {
  const response = await httpClient.post<AppointmentConfirmationDto>('/appointments', payload);
  return mapAppointment(response.data);
}
