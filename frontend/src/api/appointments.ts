import axios from 'axios';

export type CreateAppointmentInput = {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  serviceId: string;
  slotId: string;
};

export type AppointmentConfirmationDto = {
  id: string;
  status: string;
  clientName: string;
  service: {
    id: string;
    name: string;
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
};

export async function createAppointment(apiBaseUrl: string, payload: CreateAppointmentInput) {
  const response = await axios.post<AppointmentConfirmationDto>(`${apiBaseUrl}/appointments`, payload);
  return response.data;
}
