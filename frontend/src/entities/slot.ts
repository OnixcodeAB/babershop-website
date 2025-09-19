import type { BarberId } from './barber';

export type SlotId = string;

export type AvailabilitySlot = {
  slotId: SlotId;
  barberId: BarberId | null;
  barberName: string | null;
  start: string;
  end: string;
};
