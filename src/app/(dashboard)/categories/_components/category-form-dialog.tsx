'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categoryCreateSchema, categoryUpdateSchema } from '@/features/category/category.schema';
import type { CategoryRecord } from '@/features/category/category.types';

export type CategoryFormValues = {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
};

type CategoryFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  category?: CategoryRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
};

const categoryTypeOptions = [
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
] as const;

export function CategoryFormDialog({ open, mode, category, onOpenChange, onSubmit }: CategoryFormDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(mode === 'create' ? categoryCreateSchema : categoryUpdateSchema) as never,
    defaultValues: {
      name: category?.name ?? '',
      type: category?.type ?? 'EXPENSE',
      color: category?.color ?? '#2563EB',
      icon: category?.icon ?? '🏷️',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        type: category?.type ?? 'EXPENSE',
        color: category?.color ?? '#2563EB',
        icon: category?.icon ?? '🏷️',
      });
    }
  }, [form, open, category]);

  return (
    <Dialog
      description={mode === 'create' ? 'Tambahkan kategori baru untuk transaksi.' : 'Perbarui kategori tanpa mengubah histori transaksi.'}
      onOpenChange={onOpenChange}
      open={open}
      title={mode === 'create' ? 'Kategori Baru' : `Edit ${category?.name ?? 'Kategori'}`}
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-2">
          <Label htmlFor="category-name">Nama Kategori</Label>
          <Input id="category-name" placeholder="Contoh: Makan Siang" {...form.register('name')} />
          {form.formState.errors.name ? <p className="text-sm text-red-500">{form.formState.errors.name.message}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="category-type">Tipe</Label>
            <select
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              id="category-type"
              {...form.register('type')}
            >
              {categoryTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-icon">Icon</Label>
            <Input id="category-icon" placeholder="🍜" {...form.register('icon')} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="category-color">Warna</Label>
            <Input id="category-color" type="color" className="h-11 px-2 py-1" {...form.register('color')} />
          </div>
          <div className="grid gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p>Kategori ini akan dipakai saat membuat transaksi income atau expense.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Buat Kategori' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}