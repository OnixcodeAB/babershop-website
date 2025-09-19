import { useQuery } from '@tanstack/react-query';
import { fetchAvailability } from '../../../shared/api/availability';
import { bookingKeys } from './keys';
import type { Service } from '../../../entities/service';
import type { AvailabilitySlot } from '../../../entities/slot';

export interface NextAvailableResult {
  date: string;
  service: Service;
  slots: AvailabilitySlot[];
}

export function useNextAvailableQuery(service: Service | null, limit = 3) {
  return useQuery({
    queryKey: bookingKeys.nextAvailable(service?.id ?? null),
    enabled: Boolean(service),
    queryFn: async (): Promise<NextAvailableResult[]> => {
      if (!service) {
        return [];
      }
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const results: NextAvailableResult[] = [];

      for (let offset = 0; offset < 21 && results.length < limit; offset += 1) {
        const probeDate = new Date(start);
        probeDate.setDate(start.getDate() + offset);
        const dateValue = probeDate.toISOString().split('T')[0];
        const slots = await fetchAvailability({
          serviceId: service.id,
          date: dateValue,
        });
        if (slots.length > 0) {
          results.push({
            date: dateValue,
            service,
            slots,
          });
        }
      }

      return results;
    },
    staleTime: 1000 * 60,
  });
}
