import type { Service } from '../../entities/service';
import { httpClient } from './http';

export type ServiceDto = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
};

function mapService(dto: ServiceDto): Service {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    durationMinutes: dto.durationMinutes,
    priceCents: dto.priceCents,
    isActive: dto.isActive,
  };
}

export async function fetchServices(): Promise<Service[]> {
  const response = await httpClient.get<ServiceDto[]>('/services');
  return response.data.map(mapService);
}
