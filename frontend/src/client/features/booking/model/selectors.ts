import { type BookingState } from '../types';

export function selectIsReadyToSubmit(state: BookingState) {
  return Boolean(state.serviceId && state.slotId && state.clientName.trim().length > 0);
}

interface NextStepsParams {
  hasBarberOptions: boolean;
}

export function selectNextSteps(state: BookingState, params: NextStepsParams) {
  if (!state.serviceId) {
    return 'Choose a service to unlock the booking flow.';
  }
  if (params.hasBarberOptions && state.barberSelectionMode === 'unselected') {
    return 'Pick a preferred barber or keep "Any barber" to continue to times.';
  }
  if (!state.slotId) {
    return 'Select a date and time to move forward.';
  }
  return 'Add your contact details to confirm the appointment.';
}

export function selectClientFields(state: BookingState) {
  return {
    clientName: state.clientName,
    clientEmail: state.clientEmail,
    clientPhone: state.clientPhone,
    notes: state.notes,
  };
}
