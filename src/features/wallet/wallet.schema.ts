import { z } from 'zod';

export const walletTypeSchema = z.enum(['CASH', 'BANK', 'E_WALLET', 'CREDIT_CARD']);

export const walletCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nama wallet minimal 2 karakter').max(60, 'Nama wallet maksimal 60 karakter'),
  type: walletTypeSchema,
  icon: z.string().trim().min(1, 'Icon wajib diisi').max(8, 'Icon terlalu panjang'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format hex'),
  initialBalance: z.coerce.number().min(0, 'Saldo awal tidak boleh negatif'),
});

export const walletUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Nama wallet minimal 2 karakter').max(60, 'Nama wallet maksimal 60 karakter'),
  type: walletTypeSchema,
  icon: z.string().trim().min(1, 'Icon wajib diisi').max(8, 'Icon terlalu panjang'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format hex'),
});

export const walletTransferSchema = z.object({
  sourceWalletId: z.string().min(1, 'Wallet sumber wajib dipilih'),
  destinationWalletId: z.string().min(1, 'Wallet tujuan wajib dipilih'),
  amount: z.coerce.number().positive('Nominal transfer harus lebih besar dari 0'),
  note: z.string().trim().max(120, 'Catatan maksimal 120 karakter').optional().or(z.literal('')),
});

export type WalletCreateInput = z.infer<typeof walletCreateSchema>;
export type WalletUpdateInput = z.infer<typeof walletUpdateSchema>;
export type WalletTransferInput = z.infer<typeof walletTransferSchema>;