import axios from 'axios';

export type BarberDto = {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  }[];
};

export async function fetchBarbers(apiBaseUrl: string, serviceId?: string) {
  const url = new URL(`${apiBaseUrl}/barbers`);
  if (serviceId) {
    url.searchParams.set('serviceId', serviceId);
  }

  const response = await axios.get<BarberDto[]>(url.toString());
  return response.data;
}
