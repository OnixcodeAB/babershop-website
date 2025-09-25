import { useQuery } from '@tanstack/react-query';
import { fetchAvailability } from '../../../shared/api/availability';
import { bookingKeys } from './keys';

export function useAvailabilityQuery(serviceId: string | null, barberId: string | null, date: string) {
  return useQuery({
    queryKey: bookingKeys.availability(serviceId, barberId, date),
    enabled: Boolean(serviceId),
    queryFn: () =>
      fetchAvailability({
        serviceId: serviceId!,
        barberId,
        date,
      }),
  });
}
