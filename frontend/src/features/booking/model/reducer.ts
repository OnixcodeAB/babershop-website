import { initialBookingState, type BookingEvent, type BookingState } from '../types';

export function bookingReducer(state: BookingState, event: BookingEvent): BookingState {
  switch (event.type) {
    case 'BOOKING_RESET':
      return {
        ...initialBookingState,
        date: state.date,
      };
    case 'SERVICE_SELECTED':
      return {
        ...state,
        serviceId: event.payload.serviceId,
        barberId: null,
        barberSelectionMode: 'unselected',
        slotId: null,
        confirmation: null,
      };
    case 'BARBER_ANY_SELECTED':
      return {
        ...state,
        barberId: null,
        barberSelectionMode: 'any',
        slotId: null,
        confirmation: null,
      };
    case 'BARBER_SPECIFIC_SELECTED':
      return {
        ...state,
        barberId: event.payload.barberId,
        barberSelectionMode: 'specific',
        slotId: null,
        confirmation: null,
      };
    case 'BARBER_SELECTION_CLEARED':
      return {
        ...state,
        barberId: null,
        barberSelectionMode: 'unselected',
        slotId: null,
      };
    case 'DATE_SET':
      return {
        ...state,
        date: event.payload.date,
        slotId: null,
        confirmation: null,
      };
    case 'SLOT_SELECTED':
      return {
        ...state,
        slotId: event.payload.slotId,
        barberId:
          event.payload.barberId !== undefined ? event.payload.barberId : state.barberId,
        barberSelectionMode:
          event.payload.barberId && event.payload.slotId
            ? 'specific'
            : state.barberSelectionMode,
        confirmation: null,
      };
    case 'CLIENT_FIELD_CHANGED':
      return {
        ...state,
        [event.payload.field]: event.payload.value,
      };
    case 'CONFIRMED':
      return {
        ...state,
        confirmation: event.payload.confirmation,
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        notes: '',
        slotId: null,
      };
    case 'CONFIRMATION_CLEARED':
      return {
        ...state,
        confirmation: null,
      };
    default:
      return state;
  }
}
