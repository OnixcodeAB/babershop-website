import { useBookingContext } from '../model';
import type { AppointmentConfirmation } from '../../../entities/appointment';

export function useBookingState() {
  const { state } = useBookingContext();
  return state;
}

export function useBookingActions() {
  const { dispatch } = useBookingContext();

  return {
    reset: () => dispatch({ type: 'BOOKING_RESET' }),
    selectService: (serviceId: string) => dispatch({ type: 'SERVICE_SELECTED', payload: { serviceId } }),
    selectSpecificBarber: (barberId: string) => dispatch({ type: 'BARBER_SPECIFIC_SELECTED', payload: { barberId } }),
    selectAnyBarber: () => dispatch({ type: 'BARBER_ANY_SELECTED' }),
    clearBarberSelection: () => dispatch({ type: 'BARBER_SELECTION_CLEARED' }),
    setDate: (date: string) => dispatch({ type: 'DATE_SET', payload: { date } }),
    selectSlot: (slotId: string | null, barberId?: string | null) =>
      dispatch({ type: 'SLOT_SELECTED', payload: { slotId, barberId } }),
    changeClientField: (field: 'clientName' | 'clientEmail' | 'clientPhone' | 'notes', value: string) =>
      dispatch({ type: 'CLIENT_FIELD_CHANGED', payload: { field, value } }),
    confirm: (confirmation: AppointmentConfirmation) =>
      dispatch({ type: 'CONFIRMED', payload: { confirmation } }),
    clearConfirmation: () => dispatch({ type: 'CONFIRMATION_CLEARED' }),
  };
}
