import 'server-only';

import { PrismaTransactionRepository } from '@/features/transaction/transaction.repository';
import {
  transactionBulkDeleteSchema,
  transactionMutationSchema,
  transactionQuerySchema,
  type TransactionBulkDeleteInput,
  type TransactionMutationInput,
  type TransactionQueryInput,
} from '@/features/transaction/transaction.schema';
import type { TransactionDashboard } from '@/features/transaction/transaction.types';

const transactionRepository = new PrismaTransactionRepository();

function normalizeFilters(query: Partial<Record<string, string | number | string[] | undefined>> | TransactionQueryInput | undefined): TransactionQueryInput {
  const firstValue = (value: string | number | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  return transactionQuerySchema.parse({
    search: firstValue(query?.search) ?? '',
    type: firstValue(query?.type) ?? 'ALL',
    walletId: firstValue(query?.walletId) ?? '',
    categoryId: firstValue(query?.categoryId) ?? '',
    page: firstValue(query?.page) ?? 1,
    pageSize: firstValue(query?.pageSize) ?? 10,
    sortBy: firstValue(query?.sortBy) ?? 'transactionDate',
    sortDirection: firstValue(query?.sortDirection) ?? 'desc',
  });
}

export class TransactionService {
  async getDashboard(
    userId: string,
    query?: Partial<Record<string, string | string[] | undefined>> | TransactionQueryInput,
  ): Promise<TransactionDashboard> {
    const filters = normalizeFilters(query);
    const [list, wallets, categories] = await Promise.all([
      transactionRepository.listTransactions(userId, filters),
      transactionRepository.listWalletOptions(userId),
      transactionRepository.listCategoryOptions(userId),
    ]);

    return {
      ...list,
      wallets,
      categories,
    };
  }

  async createTransaction(userId: string, input: TransactionMutationInput) {
    const parsed = transactionMutationSchema.parse(input);
    return transactionRepository.createTransaction(userId, parsed);
  }

  async updateTransaction(userId: string, transactionId: string, input: TransactionMutationInput) {
    const parsed = transactionMutationSchema.parse(input);
    return transactionRepository.updateTransaction(userId, transactionId, parsed);
  }

  async deleteTransaction(userId: string, transactionId: string) {
    return transactionRepository.deleteTransaction(userId, transactionId);
  }

  async duplicateTransaction(userId: string, transactionId: string) {
    return transactionRepository.duplicateTransaction(userId, transactionId);
  }

  async bulkDeleteTransactions(userId: string, input: TransactionBulkDeleteInput) {
    const parsed = transactionBulkDeleteSchema.parse(input);
    return transactionRepository.bulkDeleteTransactions(userId, parsed);
  }

  async getOptions(userId: string) {
    const [wallets, categories] = await Promise.all([
      transactionRepository.listWalletOptions(userId),
      transactionRepository.listCategoryOptions(userId),
    ]);

    return { wallets, categories };
  }
}

export const transactionService = new TransactionService();