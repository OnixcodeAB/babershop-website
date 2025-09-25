import type { ComponentPropsWithoutRef } from 'react';
import type { Barber } from '../../../entities/barber';

interface BarberCardProps extends ComponentPropsWithoutRef<'button'> {
  barber: Barber;
  selected?: boolean;
  disabled?: boolean;
}

export function BarberCard({ barber, selected = false, disabled = false, className = '', ...rest }: BarberCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${className}`.trim()}
      {...rest}
    >
      <h3 className="text-base font-semibold text-white">{barber.name}</h3>
      {barber.bio ? <p className="mt-2 text-sm text-slate-400">{barber.bio}</p> : null}
      {barber.services.length > 0 ? (
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">
          {barber.services.map((service) => service.name).join(' - ')}
        </p>
      ) : null}
    </button>
  );
}

