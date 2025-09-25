import { useQuery } from '@tanstack/react-query';
import { fetchServices } from '../../../shared/api/services';
import { bookingKeys } from './keys';

export function useServicesQuery() {
  return useQuery({
    queryKey: bookingKeys.services(),
    queryFn: fetchServices,
    staleTime: 1000 * 60,
  });
}
