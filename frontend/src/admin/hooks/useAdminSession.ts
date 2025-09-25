import { useQuery } from '@tanstack/react-query';
import { fetchAdminSession, type AdminSessionResponse } from '../api/session';

export function useAdminSession() {
  return useQuery<AdminSessionResponse, unknown>({
    queryKey: ['admin', 'session'],
    queryFn: fetchAdminSession,
    retry: false,
  });
}
