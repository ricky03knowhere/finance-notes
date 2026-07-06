'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { budgetCreateSchema, budgetUpdateSchema } from '@/features/budget/budget.schema';
import type { BudgetCategoryOption, BudgetRecord } from '@/features/budget/budget.types';

export type BudgetFormValues = {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
};

type BudgetFormDialogProps = {
  categories: BudgetCategoryOption[];
  mode: 'create' | 'edit';
  budget: BudgetRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BudgetFormValues) => Promise<void> | void;
};

const months = [
  { label: 'Jan', value: 1 },
  { label: 'Feb', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Agu', value: 8 },
  { label: 'Sep', value: 9 },
  { label: 'Okt', value: 10 },
  { label: 'Nov', value: 11 },
  { label: 'Des', value: 12 },
];

const years = Array.from({ length: 5 }, (_, index) => 2024 + index);

export function BudgetFormDialog({ categories, mode, budget, open, onOpenChange, onSubmit }: BudgetFormDialogProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(mode === 'create' ? budgetCreateSchema : budgetUpdateSchema) as never,
    defaultValues: {
      categoryId: budget?.categoryId ?? categories[0]?.id ?? '',
      amount: budget?.amount ?? 0,
      month: budget?.month ?? new Date().getMonth() + 1,
      year: budget?.year ?? new Date().getFullYear(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: budget?.categoryId ?? categories[0]?.id ?? '',
        amount: budget?.amount ?? 0,
        month: budget?.month ?? new Date().getMonth() + 1,
        year: budget?.year ?? new Date().getFullYear(),
      });
    }
  }, [form, open, budget, categories]);

  return (
    <Dialog
      description={mode === 'create' ? 'Tambahkan anggaran baru untuk kategori tertentu.' : 'Perbarui detail budget tanpa menghapus histori.'}
      onOpenChange={onOpenChange}
      open={open}
      title={mode === 'create' ? 'Budget Baru' : `Edit Budget`}
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-2">
          <Label htmlFor="budget-category">Kategori</Label>
          <select
            className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            id="budget-category"
            {...form.register('categoryId')}
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {form.formState.errors.categoryId ? <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budget-amount">Jumlah Budget</Label>
          <Input id="budget-amount" type="number" min={1} step="1" {...form.register('amount', { valueAsNumber: true })} />
          {form.formState.errors.amount ? <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="budget-month">Bulan</Label>
            <select
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              id="budget-month"
              {...form.register('month', { valueAsNumber: true })}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget-year">Tahun</Label>
            <select
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              id="budget-year"
              {...form.register('year', { valueAsNumber: true })}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Buat Budget' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
