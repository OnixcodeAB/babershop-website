import type { AvailabilitySlot } from '../../../entities/slot';
import { formatTimeRange } from '../../../shared/format';

export function describeSlot(slot: AvailabilitySlot) {
  return formatTimeRange(slot.start, slot.end);
}
