'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { walletCreateSchema, walletUpdateSchema } from '@/features/wallet/wallet.schema';
import type { WalletRecord } from '@/features/wallet/wallet.types';

export type WalletFormValues = {
  name: string;
  type: 'CASH' | 'BANK' | 'E_WALLET' | 'CREDIT_CARD';
  icon: string;
  color: string;
  initialBalance?: number;
};

type WalletFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  wallet?: WalletRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WalletFormValues) => Promise<void> | void;
};

const walletTypeOptions = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Bank', value: 'BANK' },
  { label: 'E-Wallet', value: 'E_WALLET' },
  { label: 'Credit Card', value: 'CREDIT_CARD' },
] as const;

export function WalletFormDialog({ open, mode, wallet, onOpenChange, onSubmit }: WalletFormDialogProps) {
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(mode === 'create' ? walletCreateSchema : walletUpdateSchema) as never,
    defaultValues: {
      name: wallet?.name ?? '',
      type: wallet?.type ?? 'CASH',
      icon: wallet?.icon ?? '💼',
      color: wallet?.color ?? '#2563EB',
      initialBalance: wallet?.initialBalance ?? 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: wallet?.name ?? '',
        type: wallet?.type ?? 'CASH',
        icon: wallet?.icon ?? '💼',
        color: wallet?.color ?? '#2563EB',
        initialBalance: wallet?.initialBalance ?? 0,
      });
    }
  }, [form, open, wallet]);

  return (
    <Dialog
      description={mode === 'create' ? 'Tambahkan wallet baru untuk memisahkan sumber dana.' : 'Perbarui identitas visual wallet tanpa mengubah saldo.'}
      onOpenChange={onOpenChange}
      open={open}
      title={mode === 'create' ? 'Wallet Baru' : `Edit ${wallet?.name ?? 'Wallet'}`}
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-2">
          <Label htmlFor="wallet-name">Nama Wallet</Label>
          <Input id="wallet-name" placeholder="Contoh: Dompet Utama" {...form.register('name')} />
          {form.formState.errors.name ? <p className="text-sm text-red-500">{form.formState.errors.name.message}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="wallet-type">Tipe</Label>
            <select
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              id="wallet-type"
              {...form.register('type')}
            >
              {walletTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wallet-icon">Icon</Label>
            <Input id="wallet-icon" placeholder="💳" {...form.register('icon')} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="wallet-color">Warna</Label>
            <Input id="wallet-color" type="color" className="h-11 px-2 py-1" {...form.register('color')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wallet-note">Catatan</Label>
            <Textarea id="wallet-note" placeholder="Opsional untuk konteks tambahan" disabled className="min-h-11 opacity-60" />
          </div>
        </div>

        {mode === 'create' ? (
          <div className="grid gap-2">
            <Label htmlFor="wallet-initial-balance">Saldo Awal</Label>
            <Input id="wallet-initial-balance" type="number" min={0} step="1" {...form.register('initialBalance', { valueAsNumber: true })} />
            {form.formState.errors.initialBalance ? <p className="text-sm text-red-500">{form.formState.errors.initialBalance.message}</p> : null}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Buat Wallet' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}