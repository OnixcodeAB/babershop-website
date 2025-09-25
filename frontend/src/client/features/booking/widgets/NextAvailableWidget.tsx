import type { AppointmentConfirmation } from '../../../entities/appointment';
import type { NextAvailableResult } from '../queries/useNextAvailableQuery';
import { formatDateTime, formatAppointmentStatus } from '../../../shared/format';

interface NextAvailableWidgetProps {
  confirmation: AppointmentConfirmation | null;
  isLoading: boolean;
  nextAvailable: NextAvailableResult[];
}

export function NextAvailableWidget({ confirmation, isLoading, nextAvailable }: NextAvailableWidgetProps) {
  const primary = nextAvailable[0] ?? null;
  const alternates = nextAvailable.slice(1, 3);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Next appointment</p>
      {confirmation ? (
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-lg font-semibold text-white">{formatDateTime(confirmation.slot.start)}</p>
          <p className="text-slate-300">
            {confirmation.service.name} with {confirmation.barber?.name ?? 'our next available barber'}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Status: {formatAppointmentStatus(confirmation.status)}</p>
          <p className="text-xs text-slate-500">
            Reference: <span className="font-mono text-slate-200">{confirmation.id}</span>
          </p>
        </div>
      ) : isLoading ? (
        <p className="mt-3 text-sm text-slate-400">Checking the calendar...</p>
      ) : primary ? (
        <div className="mt-3 space-y-3 text-sm">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-white">{formatDateTime(primary.slots[0].start)}</p>
            <p className="text-slate-300">Earliest opening for {primary.service.name}</p>
            {primary.slots[0].barberName ? (
              <p className="text-xs text-slate-500">With {primary.slots[0].barberName}</p>
            ) : null}
          </div>
          {alternates.length > 0 ? (
            <div className="space-y-1 text-xs text-slate-500">
              {alternates.map((option) => (
                <p key={option.date}>
                  {new Date(option.slots[0].start).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {formatDateTime(option.slots[0].start)}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Select a service to preview the next available appointment.</p>
      )}
    </div>
  );
}

