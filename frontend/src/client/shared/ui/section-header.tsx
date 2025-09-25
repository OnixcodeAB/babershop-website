import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: 'start' | 'center';
}

export function SectionHeader({ eyebrow, title, description, align = 'start' }: SectionHeaderProps) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <div className={`flex flex-col gap-2 ${alignment}`}>
      {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">{eyebrow}</p> : null}
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      {description ? <p className="text-sm text-slate-300">{description}</p> : null}
    </div>
  );
}
