interface StepHeaderProps {
  step: number;
  title: string;
  subtitle: string;
}

export function StepHeader({ step, title, subtitle }: StepHeaderProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Step {step}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
