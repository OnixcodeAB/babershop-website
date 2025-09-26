export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-200">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-slate-800 px-4 py-2 text-sm" onClick={onCancel}>{cancelLabel}</button>
          <button className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

