'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { savingGoalCreateSchema, savingGoalUpdateSchema } from '@/features/saving-goal/saving-goal.schema';
import type { SavingGoalRecord } from '@/features/saving-goal/saving-goal.types';

export type SavingGoalFormValues = {
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
};

type SavingGoalFormDialogProps = {
  mode: 'create' | 'edit';
  goal: SavingGoalRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SavingGoalFormValues) => Promise<void> | void;
};

export function SavingGoalFormDialog({ mode, goal, open, onOpenChange, onSubmit }: SavingGoalFormDialogProps) {
  const form = useForm<SavingGoalFormValues>({
    resolver: zodResolver(mode === 'create' ? savingGoalCreateSchema : savingGoalUpdateSchema) as never,
    defaultValues: {
      title: goal?.title ?? '',
      targetAmount: goal?.targetAmount ?? 0,
      currentAmount: goal?.currentAmount ?? 0,
      deadline: goal?.deadline ? new Date(goal.deadline).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: goal?.title ?? '',
        targetAmount: goal?.targetAmount ?? 0,
        currentAmount: goal?.currentAmount ?? 0,
        deadline: goal?.deadline ? new Date(goal.deadline).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      });
    }
  }, [form, open, goal]);

  return (
    <Dialog
      title={mode === 'create' ? 'Saving Goal Baru' : 'Edit Saving Goal'}
      description={mode === 'create' ? 'Buat target tabungan baru.' : 'Perbarui target tabungan.'}
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
          <Label htmlFor="goal-title">Judul</Label>
          <Input id="goal-title" {...form.register('title')} />
          {form.formState.errors.title ? <p className="text-sm text-red-500">{form.formState.errors.title.message}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="goal-target">Target</Label>
            <Input id="goal-target" type="number" min={1} step="1" {...form.register('targetAmount', { valueAsNumber: true })} />
            {form.formState.errors.targetAmount ? <p className="text-sm text-red-500">{form.formState.errors.targetAmount.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal-current">Tersimpan</Label>
            <Input id="goal-current" type="number" min={0} step="1" {...form.register('currentAmount', { valueAsNumber: true })} />
            {form.formState.errors.currentAmount ? <p className="text-sm text-red-500">{form.formState.errors.currentAmount.message}</p> : null}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="goal-deadline">Deadline</Label>
          <Input id="goal-deadline" type="datetime-local" {...form.register('deadline')} />
          {form.formState.errors.deadline ? <p className="text-sm text-red-500">{form.formState.errors.deadline.message}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Buat Goal' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
