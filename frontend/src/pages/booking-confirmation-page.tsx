import { BookingProvider } from '../features/booking';
import { BookingConfirmationPage as BookingConfirmationView } from '../features/booking/ui/BookingConfirmationPage';

export function BookingConfirmationPage() {
  return (
    <BookingProvider>
      <BookingConfirmationView />
    </BookingProvider>
  );
}
