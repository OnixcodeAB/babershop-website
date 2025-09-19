import type { ComponentPropsWithoutRef } from 'react';
import type { AvailabilitySlot } from '../../../entities/slot';
import { describeSlot } from '../lib';

interface SlotPillProps extends ComponentPropsWithoutRef<'button'> {
  timeSlot: AvailabilitySlot;
  selected?: boolean;
}

export function SlotPill({ timeSlot, selected = false, className = '', ...rest }: SlotPillProps) {
  return (
    <button
      type="button"
      className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        selected
          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
      } ${className}`.trim()}
      {...rest}
    >
      {describeSlot(timeSlot)}
    </button>
  );
}
