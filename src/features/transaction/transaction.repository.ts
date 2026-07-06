import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type {
  TransactionBulkDeleteInput,
  TransactionMutationInput,
  TransactionQueryInput,
} from '@/features/transaction/transaction.schema';
import type { TransactionDashboard, TransactionOption, TransactionRecord, TransactionSummary } from '@/features/transaction/transaction.types';

type DecimalLike = {
  toString(): string;
};

type TransactionRow = {
  id: string;
  walletId: string;
  wallet: { name: string; color: string };
  destinationWalletId: string | null;
  destinationWallet: { name: string; color: string } | null;
  categoryId: string | null;
  category: { name: string; color: string; icon: string } | null;
  type: TransactionRecord['type'];
  amount: DecimalLike;
  note: string | null;
  transactionDate: Date;
  attachment: string | null;
  location: string | null;
  createdAt: Date;
  tags: Array<{ tag: { name: string } }>;
};

function asNumber(value: DecimalLike) {
  return Number(value.toString());
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseTags(value?: string | null) {
  return Array.from(
    new Set(
      (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function toRecord(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    walletId: row.walletId,
    walletName: row.wallet.name,
    walletColor: row.wallet.color,
    destinationWalletId: row.destinationWalletId,
    destinationWalletName: row.destinationWallet?.name ?? null,
    destinationWalletColor: row.destinationWallet?.color ?? null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    categoryColor: row.category?.color ?? null,
    categoryIcon: row.category?.icon ?? null,
    type: row.type,
    amount: asNumber(row.amount),
    note: row.note,
    transactionDate: row.transactionDate.toISOString(),
    attachment: row.attachment,
    location: row.location,
    tagNames: row.tags.map((tag) => tag.tag.name),
    createdAt: row.createdAt.toISOString(),
  };
}

function toTransactionSummary(
  totalTransactions: number,
  incomeTotal: DecimalLike | null,
  expenseTotal: DecimalLike | null,
  transferTotal: DecimalLike | null,
): TransactionSummary {
  const income = incomeTotal ? asNumber(incomeTotal) : 0;
  const expense = expenseTotal ? asNumber(expenseTotal) : 0;
  const transfer = transferTotal ? asNumber(transferTotal) : 0;

  return {
    totalTransactions,
    incomeTotal: income,
    expenseTotal: expense,
    transferTotal: transfer,
    netCashFlow: income - expense,
  };
}

function buildWhere(userId: string, query: TransactionQueryInput): Prisma.TransactionWhereInput {
  const filters: Prisma.TransactionWhereInput[] = [{ wallet: { userId } }];

  if (query.type !== 'ALL') {
    filters.push({ type: query.type });
  }

  if (query.walletId) {
    filters.push({ walletId: query.walletId });
  }

  if (query.categoryId) {
    filters.push({ categoryId: query.categoryId });
  }

  if (query.search.trim()) {
    filters.push({
      OR: [
        { note: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
        { wallet: { name: { contains: query.search, mode: 'insensitive' } } },
        { destinationWallet: { name: { contains: query.search, mode: 'insensitive' } } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
        { tags: { some: { tag: { name: { contains: query.search, mode: 'insensitive' } } } } },
      ],
    });
  }

  return { AND: filters };
}

async function syncTags(tx: Prisma.TransactionClient, transactionId: string, tagNames: string[]) {
  await tx.transactionTag.deleteMany({ where: { transactionId } });

  if (tagNames.length === 0) {
    return;
  }

  const tags = await Promise.all(
    tagNames.map((name) =>
      tx.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      }),
    ),
  );

  await tx.transactionTag.createMany({
    data: tags.map((tag) => ({ transactionId, tagId: tag.id })),
  });
}

async function getOwnedWallet(tx: Prisma.TransactionClient, userId: string, walletId: string) {
  const wallet = await tx.wallet.findFirst({ where: { id: walletId, userId } });

  if (!wallet) {
    throw new Error('Wallet tidak ditemukan');
  }

  return wallet;
}

async function getOwnedCategory(tx: Prisma.TransactionClient, userId: string, categoryId: string) {
  const category = await tx.category.findFirst({ where: { id: categoryId, userId } });

  if (!category) {
    throw new Error('Kategori tidak ditemukan');
  }

  return category;
}

async function applyEffect(tx: Prisma.TransactionClient, userId: string, input: TransactionMutationInput) {
  const sourceWallet = await getOwnedWallet(tx, userId, input.walletId);
  const destinationWalletId = normalizeText(input.destinationWalletId);
  const categoryId = normalizeText(input.categoryId);

  if (input.type === 'TRANSFER') {
    const destinationWallet = await getOwnedWallet(tx, userId, destinationWalletId ?? '');

    if (sourceWallet.id === destinationWallet.id) {
      throw new Error('Wallet sumber dan tujuan tidak boleh sama');
    }

    if (Number(sourceWallet.balance) < input.amount) {
      throw new Error('Saldo wallet sumber tidak cukup');
    }

    await tx.wallet.update({ where: { id: sourceWallet.id }, data: { balance: { decrement: input.amount } } });
    await tx.wallet.update({ where: { id: destinationWallet.id }, data: { balance: { increment: input.amount } } });

    return { sourceWallet, destinationWallet };
  }

  const category = await getOwnedCategory(tx, userId, categoryId ?? '');

  if (category.type !== input.type) {
    throw new Error('Tipe kategori tidak sesuai dengan tipe transaksi');
  }

  if (input.type === 'INCOME') {
    await tx.wallet.update({ where: { id: sourceWallet.id }, data: { balance: { increment: input.amount } } });
  }

  if (input.type === 'EXPENSE') {
    if (Number(sourceWallet.balance) < input.amount) {
      throw new Error('Saldo wallet tidak cukup');
    }

    await tx.wallet.update({ where: { id: sourceWallet.id }, data: { balance: { decrement: input.amount } } });
  }

  return { sourceWallet, category };
}

async function reverseEffect(tx: Prisma.TransactionClient, userId: string, row: TransactionRow) {
  const sourceWallet = await getOwnedWallet(tx, userId, row.walletId);

  if (row.type === 'INCOME') {
    await tx.wallet.update({ where: { id: sourceWallet.id }, data: { balance: { decrement: asNumber(row.amount) } } });
    return;
  }

  if (row.type === 'EXPENSE') {
    await tx.wallet.update({ where: { id: sourceWallet.id }, data: { balance: { increment: asNumber(row.amount) } } });
    return;
  }

  if (!row.destinationWalletId) {
    throw new Error('Data transfer tidak valid');
  }

  const destinationWallet = await getOwnedWallet(tx, userId, row.destinationWalletId);
  await tx.wallet.update({ where: { id: sourceWallet.id }, data: { balance: { increment: asNumber(row.amount) } } });
  await tx.wallet.update({ where: { id: destinationWallet.id }, data: { balance: { decrement: asNumber(row.amount) } } });
}

async function loadTransaction(tx: Prisma.TransactionClient, userId: string, transactionId: string) {
  const transaction = await tx.transaction.findFirst({
    where: {
      id: transactionId,
      wallet: { userId },
    },
    include: {
      wallet: { select: { name: true, color: true } },
      destinationWallet: { select: { name: true, color: true } },
      category: { select: { name: true, color: true, icon: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  });

  if (!transaction) {
    throw new Error('Transaksi tidak ditemukan');
  }

  return transaction;
}

async function listWalletOptions(userId: string): Promise<TransactionOption[]> {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, color: true, icon: true, type: true },
  });

  return wallets as TransactionOption[];
}

async function listCategoryOptions(userId: string): Promise<TransactionOption[]> {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, color: true, icon: true, type: true },
  });

  return categories as TransactionOption[];
}

export interface TransactionRepository {
  listTransactions(userId: string, query: TransactionQueryInput): Promise<Pick<TransactionDashboard, 'summary' | 'transactions' | 'pagination' | 'filters'>>;
  listWalletOptions(userId: string): Promise<TransactionOption[]>;
  listCategoryOptions(userId: string): Promise<TransactionOption[]>;
  createTransaction(userId: string, input: TransactionMutationInput): Promise<TransactionRecord>;
  updateTransaction(userId: string, transactionId: string, input: TransactionMutationInput): Promise<TransactionRecord>;
  deleteTransaction(userId: string, transactionId: string): Promise<void>;
  duplicateTransaction(userId: string, transactionId: string): Promise<TransactionRecord>;
  bulkDeleteTransactions(userId: string, input: TransactionBulkDeleteInput): Promise<number>;
}

export class PrismaTransactionRepository implements TransactionRepository {
  async listTransactions(userId: string, query: TransactionQueryInput) {
    const where = buildWhere(userId, query);
    const orderBy = { [query.sortBy]: query.sortDirection } as Prisma.TransactionOrderByWithRelationInput;
    const skip = (query.page - 1) * query.pageSize;

    const [total, incomeAggregate, expenseAggregate, transferAggregate, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({ where: { AND: [where, { type: 'INCOME' }] }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { AND: [where, { type: 'EXPENSE' }] }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { AND: [where, { type: 'TRANSFER' }] }, _sum: { amount: true } }),
      prisma.transaction.findMany({
        where,
        include: {
          wallet: { select: { name: true, color: true } },
          destinationWallet: { select: { name: true, color: true } },
          category: { select: { name: true, color: true, icon: true } },
          tags: { include: { tag: { select: { name: true } } } },
        },
        orderBy,
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      summary: toTransactionSummary(total, incomeAggregate._sum.amount, expenseAggregate._sum.amount, transferAggregate._sum.amount),
      transactions: rows.map((row) => toRecord(row)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      },
      filters: query,
    };
  }

  async listWalletOptions(userId: string) {
    return listWalletOptions(userId);
  }

  async listCategoryOptions(userId: string) {
    return listCategoryOptions(userId);
  }

  async createTransaction(userId: string, input: TransactionMutationInput) {
    const normalizedInput = {
      ...input,
      destinationWalletId: normalizeText(input.destinationWalletId),
      categoryId: normalizeText(input.categoryId),
      note: normalizeText(input.note),
      attachment: normalizeText(input.attachment),
      location: normalizeText(input.location),
      tags: parseTags(input.tagsInput),
    };

    return prisma.$transaction(async (tx) => {
      await applyEffect(tx, userId, normalizedInput as TransactionMutationInput);

      const transaction = await tx.transaction.create({
        data: {
          walletId: normalizedInput.walletId,
          destinationWalletId: normalizedInput.type === 'TRANSFER' ? normalizedInput.destinationWalletId : null,
          categoryId: normalizedInput.type === 'TRANSFER' ? null : normalizedInput.categoryId,
          type: normalizedInput.type,
          amount: normalizedInput.amount,
          note: normalizedInput.note,
          transactionDate: normalizedInput.transactionDate,
          attachment: normalizedInput.attachment,
          location: normalizedInput.location,
        },
      });

      await syncTags(tx, transaction.id, normalizedInput.tags);

      return loadTransaction(tx, userId, transaction.id).then(toRecord);
    });
  }

  async updateTransaction(userId: string, transactionId: string, input: TransactionMutationInput) {
    const normalizedInput = {
      ...input,
      destinationWalletId: normalizeText(input.destinationWalletId),
      categoryId: normalizeText(input.categoryId),
      note: normalizeText(input.note),
      attachment: normalizeText(input.attachment),
      location: normalizeText(input.location),
      tags: parseTags(input.tagsInput),
    };

    return prisma.$transaction(async (tx) => {
      const existing = await loadTransaction(tx, userId, transactionId);
      await reverseEffect(tx, userId, existing as unknown as TransactionRow);

      await applyEffect(tx, userId, normalizedInput as TransactionMutationInput);

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          walletId: normalizedInput.walletId,
          destinationWalletId: normalizedInput.type === 'TRANSFER' ? normalizedInput.destinationWalletId : null,
          categoryId: normalizedInput.type === 'TRANSFER' ? null : normalizedInput.categoryId,
          type: normalizedInput.type,
          amount: normalizedInput.amount,
          note: normalizedInput.note,
          transactionDate: normalizedInput.transactionDate,
          attachment: normalizedInput.attachment,
          location: normalizedInput.location,
        },
      });

      await syncTags(tx, transactionId, normalizedInput.tags);

      return loadTransaction(tx, userId, transactionId).then(toRecord);
    });
  }

  async deleteTransaction(userId: string, transactionId: string) {
    await prisma.$transaction(async (tx) => {
      const existing = await loadTransaction(tx, userId, transactionId);
      await reverseEffect(tx, userId, existing as unknown as TransactionRow);
      await tx.transactionTag.deleteMany({ where: { transactionId } });
      await tx.transaction.delete({ where: { id: transactionId } });
    });
  }

  async duplicateTransaction(userId: string, transactionId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await loadTransaction(tx, userId, transactionId);
      const clonedInput: TransactionMutationInput = {
        walletId: existing.walletId,
        destinationWalletId: existing.destinationWalletId ?? '',
        categoryId: existing.categoryId ?? '',
        type: existing.type,
        amount: asNumber(existing.amount as DecimalLike),
        note: existing.note ? `${existing.note} (Salin)` : 'Salin transaksi',
        transactionDate: new Date(),
        attachment: existing.attachment ?? '',
        location: existing.location ?? '',
        tagsInput: existing.tags.map((tag) => tag.tag.name).join(', '),
      };

      await applyEffect(tx, userId, clonedInput);

      const transaction = await tx.transaction.create({
        data: {
          walletId: clonedInput.walletId,
          destinationWalletId: clonedInput.type === 'TRANSFER' ? normalizeText(clonedInput.destinationWalletId) : null,
          categoryId: clonedInput.type === 'TRANSFER' ? null : normalizeText(clonedInput.categoryId),
          type: clonedInput.type,
          amount: clonedInput.amount,
          note: normalizeText(clonedInput.note),
          transactionDate: clonedInput.transactionDate,
          attachment: normalizeText(clonedInput.attachment),
          location: normalizeText(clonedInput.location),
        },
      });

      await syncTags(tx, transaction.id, parseTags(clonedInput.tagsInput));

      return loadTransaction(tx, userId, transaction.id).then(toRecord);
    });
  }

  async bulkDeleteTransactions(userId: string, input: TransactionBulkDeleteInput) {
    return prisma.$transaction(async (tx) => {
      const transactions = await Promise.all(input.ids.map((transactionId) => loadTransaction(tx, userId, transactionId)));

      for (const transaction of transactions) {
        await reverseEffect(tx, userId, transaction as unknown as TransactionRow);
      }

      await tx.transactionTag.deleteMany({ where: { transactionId: { in: input.ids } } });
      const result = await tx.transaction.deleteMany({ where: { id: { in: input.ids } } });

      return result.count;
    });
  }
}