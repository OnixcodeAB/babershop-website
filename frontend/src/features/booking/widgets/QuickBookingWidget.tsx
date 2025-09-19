import { Button } from '../../../shared/ui';
import { formatDateTime } from '../../../shared/format';

interface QuickBookingWidgetProps {
  nextSteps: string;
  onQuickBook: () => void;
  disabled?: boolean;
  highlight?: {
    start: string;
    serviceName: string;
    barberName?: string | null;
  } | null;
}

export function QuickBookingWidget({ nextSteps, onQuickBook, disabled = false, highlight }: QuickBookingWidgetProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Quick booking</p>
      <p className="mt-2 text-sm text-slate-300">{nextSteps}</p>
      {highlight ? (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
          Next up: {highlight.serviceName} · {formatDateTime(highlight.start)}
          {highlight.barberName ? ` with ${highlight.barberName}` : ''}
        </div>
      ) : null}
      <Button
        type="button"
        onClick={onQuickBook}
        disabled={disabled}
        className="mt-4"
      >
        Jump to service selection
      </Button>
    </div>
  );
}
