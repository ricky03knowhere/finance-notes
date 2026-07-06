import { z } from 'zod';

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);

const optionalText = z.string().trim().max(255, 'Maksimal 255 karakter').optional().or(z.literal(''));

export const transactionMutationSchema = z
  .object({
    walletId: z.string().min(1, 'Wallet wajib dipilih'),
    destinationWalletId: z.string().optional().or(z.literal('')),
    categoryId: z.string().optional().or(z.literal('')),
    type: transactionTypeSchema,
    amount: z.coerce.number().positive('Nominal harus lebih besar dari 0'),
    note: optionalText,
    transactionDate: z.coerce.date(),
    attachment: optionalText,
    location: z.string().trim().max(120, 'Lokasi maksimal 120 karakter').optional().or(z.literal('')),
    tagsInput: z.string().trim().max(200, 'Tag maksimal 200 karakter').optional().or(z.literal('')),
  })
  .superRefine((value, context) => {
    if (value.type === 'TRANSFER') {
      if (!value.destinationWalletId) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Wallet tujuan wajib dipilih', path: ['destinationWalletId'] });
      }
      if (value.categoryId) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Transfer tidak memakai kategori', path: ['categoryId'] });
      }
    }

    if (value.type !== 'TRANSFER' && !value.categoryId) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Kategori wajib dipilih', path: ['categoryId'] });
    }

    if (value.destinationWalletId && value.destinationWalletId === value.walletId) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Wallet tujuan tidak boleh sama dengan wallet sumber', path: ['destinationWalletId'] });
    }
  });

export const transactionQuerySchema = z.object({
  search: z.string().optional().default(''),
  type: z.enum(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER']).optional().default('ALL'),
  walletId: z.string().optional().default(''),
  categoryId: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  sortBy: z.enum(['transactionDate', 'amount', 'createdAt']).optional().default('transactionDate'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const transactionBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Pilih setidaknya satu transaksi'),
});

export type TransactionMutationInput = z.infer<typeof transactionMutationSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
export type TransactionBulkDeleteInput = z.infer<typeof transactionBulkDeleteSchema>;