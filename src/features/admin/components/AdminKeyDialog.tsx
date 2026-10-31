import { FormEvent, useState } from 'react';
import { Button, Dialog, FormField, Input, toast } from '../../../shared/ui';

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    onSaveKey(keyInput.trim());
    setKeyInput('');
    toast.success('Admin session unlocked');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setKeyInput('');
        onClose();
      }}
      title="Enter admin key"
      description="Kept in memory for this session only and never saved to disk."
      maxWidth="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setKeyInput('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="admin-key-form"
            disabled={!keyInput.trim()}
          >
            Unlock admin area
          </Button>
        </>
      }
    >
      <form id="admin-key-form" onSubmit={handleSubmit}>
        <FormField label="Admin key" htmlFor="admin-key-input" required>
          <Input
            id="admin-key-input"
            type="password"
            mono
            required
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter x-admin-key..."
          />
        </FormField>
      </form>
    </Dialog>
  );
}
