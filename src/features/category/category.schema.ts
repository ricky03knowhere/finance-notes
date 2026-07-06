import { z } from 'zod';

export const categoryTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter').max(60, 'Nama kategori maksimal 60 karakter'),
  type: categoryTypeSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format hex'),
  icon: z.string().trim().min(1, 'Icon wajib diisi').max(8, 'Icon terlalu panjang'),
});

export const categoryUpdateSchema = categoryCreateSchema;

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;