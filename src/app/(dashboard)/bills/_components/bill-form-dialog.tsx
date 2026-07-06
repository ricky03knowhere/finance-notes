'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { billCreateSchema, billUpdateSchema } from '@/features/bill/bill.schema';
import type { BillRecord } from '@/features/bill/bill.types';

export type BillFormValues = {
  title: string;
  amount: number;
  dueDate: string;
  recurring: boolean;
  paid: boolean;
};

type BillFormDialogProps = {
  mode: 'create' | 'edit';
  bill: BillRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BillFormValues) => Promise<void> | void;
};

export function BillFormDialog({ mode, bill, open, onOpenChange, onSubmit }: BillFormDialogProps) {
  const form = useForm<BillFormValues>({
    resolver: zodResolver(mode === 'create' ? billCreateSchema : billUpdateSchema) as never,
    defaultValues: {
      title: bill?.title ?? '',
      amount: bill?.amount ?? 0,
      dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      recurring: bill?.recurring ?? false,
      paid: bill?.paid ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: bill?.title ?? '',
        amount: bill?.amount ?? 0,
        dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        recurring: bill?.recurring ?? false,
        paid: bill?.paid ?? false,
      });
    }
  }, [form, open, bill]);

  return (
    <Dialog
      title={mode === 'create' ? 'Tagihan Baru' : 'Edit Tagihan'}
      description={mode === 'create' ? 'Tambahkan tagihan dan atur status pembayaran.' : 'Perbarui informasi tagihan.'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-2">
          <Label htmlFor="bill-title">Judul</Label>
          <Input id="bill-title" {...form.register('title')} />
          {form.formState.errors.title ? <p className="text-sm text-red-500">{form.formState.errors.title.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bill-amount">Jumlah</Label>
          <Input id="bill-amount" type="number" min={1} step="1" {...form.register('amount', { valueAsNumber: true })} />
          {form.formState.errors.amount ? <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bill-due-date">Jatuh Tempo</Label>
          <Input id="bill-due-date" type="datetime-local" {...form.register('dueDate')} />
          {form.formState.errors.dueDate ? <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <Label htmlFor="bill-recurring">Berulang</Label>
            <Switch id="bill-recurring" {...form.register('recurring')} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <Label htmlFor="bill-paid">Sudah Dibayar</Label>
            <Switch id="bill-paid" {...form.register('paid')} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Buat Tagihan' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
