import { z } from 'zod';

export const budgetCreateSchema = z.object({
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  amount: z.coerce.number().positive('Jumlah anggaran harus lebih besar dari 0'),
  month: z.coerce.number().int().min(1, 'Bulan tidak valid').max(12, 'Bulan tidak valid'),
  year: z.coerce.number().int().min(2024, 'Tahun tidak valid').max(2100, 'Tahun tidak valid'),
});

export const budgetUpdateSchema = budgetCreateSchema;

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;