import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean;
  children: ReactNode;
};

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/60 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
