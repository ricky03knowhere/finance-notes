'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletTransferSchema } from '@/features/wallet/wallet.schema';
import type { WalletRecord } from '@/features/wallet/wallet.types';

export type WalletTransferValues = {
  sourceWalletId: string;
  destinationWalletId: string;
  amount: number;
  note?: string;
};

type WalletTransferDialogProps = {
  open: boolean;
  sourceWallet: WalletRecord | null;
  wallets: WalletRecord[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WalletTransferValues) => Promise<void> | void;
};

export function WalletTransferDialog({ open, sourceWallet, wallets, onOpenChange, onSubmit }: WalletTransferDialogProps) {
  const form = useForm({
    resolver: zodResolver(walletTransferSchema),
    defaultValues: {
      sourceWalletId: sourceWallet?.id ?? '',
      destinationWalletId: '',
      amount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        sourceWalletId: sourceWallet?.id ?? '',
        destinationWalletId: '',
        amount: 0,
        note: '',
      });
    }
  }, [form, open, sourceWallet]);

  const destinationOptions = wallets.filter((wallet) => wallet.id !== sourceWallet?.id);

  return (
    <Dialog
      description={sourceWallet ? `Transfer dari wallet ${sourceWallet.name} ke wallet lain.` : 'Pilih sumber transfer dan wallet tujuan.'}
      onOpenChange={onOpenChange}
      open={open}
      title="Transfer Antar Wallet"
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <input type="hidden" {...form.register('sourceWalletId')} />

        <div className="grid gap-2">
          <Label>Wallet Sumber</Label>
          <Input value={sourceWallet?.name ?? ''} readOnly />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="wallet-destination">Wallet Tujuan</Label>
          <select
            className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            id="wallet-destination"
            {...form.register('destinationWalletId')}
          >
            <option value="">Pilih wallet tujuan</option>
            {destinationOptions.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.icon} {wallet.name}
              </option>
            ))}
          </select>
          {form.formState.errors.destinationWalletId ? <p className="text-sm text-red-500">{form.formState.errors.destinationWalletId.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="wallet-amount">Nominal</Label>
          <Input id="wallet-amount" type="number" min={1} step="1" {...form.register('amount', { valueAsNumber: true })} />
          {form.formState.errors.amount ? <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="wallet-transfer-note">Catatan</Label>
          <Input id="wallet-transfer-note" placeholder="Opsional" {...form.register('note')} />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting || destinationOptions.length === 0}>
            {form.formState.isSubmitting ? 'Memproses...' : 'Transfer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}