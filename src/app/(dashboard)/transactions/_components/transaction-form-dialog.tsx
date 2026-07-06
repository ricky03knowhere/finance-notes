'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { transactionMutationSchema } from '@/features/transaction/transaction.schema';
import type { TransactionOption, TransactionRecord, TransactionType } from '@/features/transaction/transaction.types';

export type TransactionFormValues = {
  walletId: string;
  destinationWalletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note: string;
  transactionDate: string;
  attachment: string;
  location: string;
  tagsInput: string;
};

type TransactionFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  transaction?: TransactionRecord | null;
  wallets: TransactionOption[];
  categories: TransactionOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
};

const transactionTypeOptions: Array<{ label: string; value: TransactionType }> = [
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
];

function toLocalDateTimeValue(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TransactionFormDialog({ open, mode, transaction, wallets, categories, onOpenChange, onSubmit }: TransactionFormDialogProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionMutationSchema) as never,
    defaultValues: {
      walletId: transaction?.walletId ?? wallets[0]?.id ?? '',
      destinationWalletId: transaction?.destinationWalletId ?? '',
      categoryId: transaction?.categoryId ?? '',
      type: transaction?.type ?? 'EXPENSE',
      amount: transaction?.amount ?? 0,
      note: transaction?.note ?? '',
      transactionDate: toLocalDateTimeValue(transaction?.transactionDate),
      attachment: transaction?.attachment ?? '',
      location: transaction?.location ?? '',
      tagsInput: transaction?.tagNames.join(', ') ?? '',
    },
  });

  const transactionType = form.watch('type');

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === transactionType),
    [categories, transactionType],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      walletId: transaction?.walletId ?? wallets[0]?.id ?? '',
      destinationWalletId: transaction?.destinationWalletId ?? '',
      categoryId: transaction?.categoryId ?? '',
      type: transaction?.type ?? 'EXPENSE',
      amount: transaction?.amount ?? 0,
      note: transaction?.note ?? '',
      transactionDate: toLocalDateTimeValue(transaction?.transactionDate),
      attachment: transaction?.attachment ?? '',
      location: transaction?.location ?? '',
      tagsInput: transaction?.tagNames.join(', ') ?? '',
    });
  }, [form, open, transaction, wallets]);

  useEffect(() => {
    if (transactionType === 'TRANSFER') {
      form.setValue('categoryId', '');
    } else {
      form.setValue('destinationWalletId', '');
    }
  }, [form, transactionType]);

  return (
    <Dialog
      description={mode === 'create' ? 'Catat income, expense, atau transfer antar wallet.' : 'Perbarui transaksi tanpa kehilangan histori yang ada.'}
      onOpenChange={onOpenChange}
      open={open}
      title={mode === 'create' ? 'Transaksi Baru' : `Edit Transaksi`}
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="transaction-type">Tipe</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" id="transaction-type" {...form.register('type')}>
              {transactionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction-wallet">Wallet</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" id="transaction-wallet" {...form.register('walletId')}>
              <option value="">Pilih wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.icon} {wallet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {transactionType === 'TRANSFER' ? (
          <div className="grid gap-2">
            <Label htmlFor="transaction-destination-wallet">Wallet Tujuan</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" id="transaction-destination-wallet" {...form.register('destinationWalletId')}>
              <option value="">Pilih wallet tujuan</option>
              {wallets
                .filter((wallet) => wallet.id !== form.watch('walletId'))
                .map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.icon} {wallet.name}
                  </option>
                ))}
            </select>
            {form.formState.errors.destinationWalletId ? <p className="text-sm text-red-500">{form.formState.errors.destinationWalletId.message}</p> : null}
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="transaction-category">Kategori</Label>
            <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" id="transaction-category" {...form.register('categoryId')}>
              <option value="">Pilih kategori</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {form.formState.errors.categoryId ? <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p> : null}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="transaction-amount">Nominal</Label>
            <Input id="transaction-amount" min={0} step="1" type="number" {...form.register('amount', { valueAsNumber: true })} />
            {form.formState.errors.amount ? <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction-date">Tanggal</Label>
            <Input id="transaction-date" type="datetime-local" {...form.register('transactionDate')} />
            {form.formState.errors.transactionDate ? <p className="text-sm text-red-500">{form.formState.errors.transactionDate.message as string}</p> : null}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="transaction-note">Catatan</Label>
          <Textarea id="transaction-note" placeholder="Opsional" {...form.register('note')} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="transaction-location">Lokasi</Label>
            <Input id="transaction-location" placeholder="Opsional" {...form.register('location')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transaction-attachment">Attachment / URL</Label>
            <Input id="transaction-attachment" placeholder="Opsional" {...form.register('attachment')} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="transaction-tags">Tag</Label>
          <Input id="transaction-tags" placeholder="makan, transport, kerja" {...form.register('tagsInput')} />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Buat Transaksi' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}