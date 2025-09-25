import type { ComponentPropsWithoutRef } from 'react';
import type { Service } from '../../../entities/service';
import { formatPrice } from '../../../shared/format';

interface ServiceCardProps extends ComponentPropsWithoutRef<'button'> {
  service: Service;
  selected?: boolean;
}

export function ServiceCard({ service, selected = false, className = '', ...rest }: ServiceCardProps) {
  return (
    <button
      type="button"
      className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
      } ${className}`.trim()}
      {...rest}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-white">{service.name}</h4>
        <span className="text-sm text-emerald-300">{formatPrice(service.priceCents)}</span>
      </div>
      {service.description ? <p className="mt-2 text-sm text-slate-400">{service.description}</p> : null}
      <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">{service.durationMinutes} minutes</p>
    </button>
  );
}

