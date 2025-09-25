import { useMutation } from '@tanstack/react-query';
import { createAppointment, type CreateAppointmentPayload } from '../../../shared/api/appointments';

export function useCreateAppointmentMutation() {
  return useMutation({
    mutationFn: createAppointment,
  });
}
