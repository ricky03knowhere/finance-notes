import { z } from 'zod';

export const billCreateSchema = z.object({
  title: z.string().trim().min(2, 'Judul tagihan minimal 2 karakter').max(120, 'Judul terlalu panjang'),
  amount: z.coerce.number().positive('Jumlah harus lebih besar dari 0'),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal jatuh tempo tidak valid'),
  recurring: z.boolean(),
  paid: z.boolean(),
});

export const billUpdateSchema = billCreateSchema;

export type BillCreateInput = z.infer<typeof billCreateSchema>;
export type BillUpdateInput = z.infer<typeof billUpdateSchema>;