import type { ServiceSummary } from './service';

export type BarberId = string;

export type Barber = {
  id: BarberId;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  services: ServiceSummary[];
};
