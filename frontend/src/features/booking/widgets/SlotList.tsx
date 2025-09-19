import type { AvailabilitySlot } from '../../../entities/slot';
import { SlotPill } from '../components';

interface SlotListProps {
  slots: AvailabilitySlot[];
  selectedSlotId: string | null;
  onSelect: (slot: AvailabilitySlot) => void;
}

export function SlotList({ slots, selectedSlotId, onSelect }: SlotListProps) {
  if (slots.length === 0) {
    return <p className="text-sm text-slate-400">No open slots for the selected day. Try another date.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <SlotPill
          key={slot.slotId}
          timeSlot={slot}
          selected={slot.slotId === selectedSlotId}
          onClick={() => onSelect(slot)}
        />
      ))}
    </div>
  );
}
