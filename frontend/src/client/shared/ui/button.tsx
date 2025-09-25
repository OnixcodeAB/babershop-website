import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const baseClasses =
  'inline-flex items-center justify-center font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:outline-emerald-300',
  secondary:
    'rounded-lg border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10 focus-visible:outline-emerald-300',
  ghost: 'rounded-lg text-emerald-300 hover:text-emerald-200 focus-visible:outline-emerald-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const disabledClass = rest.disabled ? 'cursor-not-allowed opacity-50' : '';
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
