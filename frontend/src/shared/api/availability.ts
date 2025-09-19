import type { AvailabilitySlot } from '../../entities/slot';
import { httpClient } from './http';

export type AvailabilityDto = {
  slotId: string;
  barberId: string | null;
  barberName: string | null;
  start: string;
  end: string;
};

function mapAvailability(dto: AvailabilityDto): AvailabilitySlot {
  return {
    slotId: dto.slotId,
    barberId: dto.barberId,
    barberName: dto.barberName,
    start: dto.start,
    end: dto.end,
  };
}

interface FetchAvailabilityParams {
  date: string;
  serviceId: string;
  barberId?: string | null;
}

export async function fetchAvailability(params: FetchAvailabilityParams): Promise<AvailabilitySlot[]> {
  const search = new URLSearchParams({
    date: params.date,
    serviceId: params.serviceId,
  });
  if (params.barberId) {
    search.set('barberId', params.barberId);
  }

  const response = await httpClient.get<AvailabilityDto[]>(`/availability?${search.toString()}`);
  return response.data.map(mapAvailability);
}
