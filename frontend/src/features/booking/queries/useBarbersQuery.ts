import { useQuery } from '@tanstack/react-query';
import { fetchBarbers } from '../../../shared/api/barbers';
import { bookingKeys } from './keys';

export function useBarbersQuery(serviceId: string | null) {
  return useQuery({
    queryKey: bookingKeys.barbers(serviceId),
    queryFn: () => fetchBarbers(serviceId ?? undefined),
    enabled: true,
    staleTime: 1000 * 60,
  });
}
