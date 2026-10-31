import { FormEvent, useState } from 'react';

interface AdminKeyDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSaveKey: (key: string) => void;
}

export function AdminKeyDialog({
  open,
  onClose,
  onSaveKey,
}: AdminKeyDialogProps) {
  const [keyInput, setKeyInput] = useState('');

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    onSaveKey(keyInput.trim());
    setKeyInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Enter Admin Key (x-admin-key)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Held in memory for the current session only. Never persisted to storage or logged.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            x-admin-key header value
          </label>
          <input
            type="password"
            required
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter admin key..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setKeyInput('');
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            Unlock Admin Area
          </button>
        </div>
      </form>
    </div>
  );
}
