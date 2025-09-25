import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppointmentStatus } from '../../client/entities/appointment';
import { fetchAdminAppointments, updateAppointmentStatus, type AdminAppointment } from '../api/appointments';

export function useAdminAppointments(status?: AppointmentStatus) {
  return useQuery<AdminAppointment[], unknown>({
    queryKey: ['admin', 'appointments', status ?? 'all'],
    queryFn: () => fetchAdminAppointments(status ? { status } : {}),
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] });
    },
  });
}