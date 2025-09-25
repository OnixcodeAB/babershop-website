import type { Service } from '../../../entities/service';
import type { Barber } from '../../../entities/barber';
import type { AvailabilitySlot } from '../../../entities/slot';
import { formatDateTime, formatPrice } from '../../../shared/format';

interface ReviewPanelProps {
  service: Service | null;
  barber: Barber | null;
  slot: AvailabilitySlot | null;
}

export function ReviewPanel({ service, barber, slot }: ReviewPanelProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Review</p>
      <dl className="mt-3 space-y-3 text-sm text-slate-300">
        <div>
          <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Service</dt>
          <dd className="mt-1">
            {service
              ? `${service.name} - ${formatPrice(service.priceCents)} - ${service.durationMinutes} min`
              : 'Choose a service in Step 2.'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Barber</dt>
          <dd className="mt-1">{barber?.name ?? slot?.barberName ?? 'Any barber'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Date &amp; time</dt>
          <dd className="mt-1">
            {slot ? formatDateTime(slot.start) : service ? 'Select a time slot in Step 4.' : 'Pick a service to view available times.'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
