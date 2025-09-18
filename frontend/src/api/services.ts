import axios from 'axios';

export type ServiceDto = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
};

export async function fetchServices(apiBaseUrl: string): Promise<ServiceDto[]> {
  const response = await axios.get<ServiceDto[]>(`${apiBaseUrl}/services`);
  return response.data;
}
