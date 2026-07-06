import { z } from 'zod';

export const savingGoalCreateSchema = z.object({
  title: z.string().trim().min(2, 'Judul minimal 2 karakter').max(100, 'Judul terlalu panjang'),
  targetAmount: z.coerce.number().positive('Jumlah target harus lebih besar dari 0'),
  currentAmount: z.coerce.number().min(0, 'Jumlah saat ini minimal 0'),
  deadline: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal deadline tidak valid'),
});

export const savingGoalUpdateSchema = savingGoalCreateSchema;

export type SavingGoalCreateInput = z.infer<typeof savingGoalCreateSchema>;
export type SavingGoalUpdateInput = z.infer<typeof savingGoalUpdateSchema>;