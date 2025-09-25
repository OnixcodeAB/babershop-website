import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { bookingReducer } from './reducer';
import { initialBookingState, type BookingEvent, type BookingState } from '../types';

interface BookingContextValue {
  state: BookingState;
  dispatch: (event: BookingEvent) => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
}
