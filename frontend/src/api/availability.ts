import axios from 'axios';

export type AvailabilitySlotDto = {
  slotId: string;
  barberId: string | null;
  barberName: string | null;
  start: string;
  end: string;
};

export type FetchAvailabilityInput = {
  apiBaseUrl: string;
  date: string;
  serviceId: string;
  barberId?: string | null;
};

export async function fetchAvailability({ apiBaseUrl, date, serviceId, barberId }: FetchAvailabilityInput) {
  const url = new URL(`${apiBaseUrl}/availability`);
  url.searchParams.set('date', date);
  url.searchParams.set('serviceId', serviceId);
  if (barberId) {
    url.searchParams.set('barberId', barberId);
  }

  const response = await axios.get<AvailabilitySlotDto[]>(url.toString());
  return response.data;
}
