import type { Barber } from '../../entities/barber';
import type { ServiceSummary } from '../../entities/service';
import { httpClient } from './http';

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

function mapServiceSummary(dto: BarberDto['services'][number]): ServiceSummary {
  return {
    id: dto.id,
    name: dto.name,
    durationMinutes: dto.durationMinutes,
    priceCents: dto.priceCents,
  };
}

function mapBarber(dto: BarberDto): Barber {
  return {
    id: dto.id,
    name: dto.name,
    bio: dto.bio,
    photoUrl: dto.photoUrl,
    services: dto.services.map(mapServiceSummary),
  };
}

export async function fetchBarbers(serviceId?: string): Promise<Barber[]> {
  const url = serviceId ? `/barbers?serviceId=${encodeURIComponent(serviceId)}` : '/barbers';
  const response = await httpClient.get<BarberDto[]>(url);
  return response.data.map(mapBarber);
}
