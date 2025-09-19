import { BookingProvider } from './model';
import { BookingFlow } from './ui';

export function BookingFeature() {
  return (
    <BookingProvider>
      <BookingFlow />
    </BookingProvider>
  );
}

export * from './hooks';
export * from './queries';
export * from './model';
