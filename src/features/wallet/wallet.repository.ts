import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type {
  WalletCreateInput,
  WalletTransferInput,
  WalletUpdateInput,
} from '@/features/wallet/wallet.schema';
import type { WalletRecord, WalletTransactionRecord } from '@/features/wallet/wallet.types';

type DecimalLike = {
  toString(): string;
};

function mapWallet(wallet: {
  id: string;
  name: string;
  type: WalletRecord['type'];
  icon: string;
  color: string;
  balance: DecimalLike;
  initialBalance: DecimalLike;
  createdAt: Date;
}): WalletRecord {
  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    icon: wallet.icon,
    color: wallet.color,
    balance: Number(wallet.balance),
    initialBalance: Number(wallet.initialBalance),
    createdAt: wallet.createdAt.toISOString(),
  };
}

function mapTransaction(transaction: {
  id: string;
  walletId: string;
  wallet: { name: string; color: string };
  type: WalletTransactionRecord['type'];
  amount: DecimalLike;
  note: string | null;
  transactionDate: Date;
}): WalletTransactionRecord {
  return {
    id: transaction.id,
    walletId: transaction.walletId,
    walletName: transaction.wallet.name,
    walletColor: transaction.wallet.color,
    type: transaction.type,
    amount: Number(transaction.amount),
    note: transaction.note,
    transactionDate: transaction.transactionDate.toISOString(),
  };
}

export interface WalletRepository {
  listWallets(userId: string): Promise<WalletRecord[]>;
  getWalletById(userId: string, walletId: string): Promise<WalletRecord | null>;
  createWallet(userId: string, input: WalletCreateInput): Promise<WalletRecord>;
  updateWallet(userId: string, walletId: string, input: WalletUpdateInput): Promise<WalletRecord>;
  deleteWallet(userId: string, walletId: string): Promise<void>;
  transferBalance(userId: string, input: WalletTransferInput): Promise<void>;
  listRecentTransactions(userId: string, limit: number): Promise<WalletTransactionRecord[]>;
}

export class PrismaWalletRepository implements WalletRepository {
  async listWallets(userId: string) {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    return wallets.map(mapWallet);
  }

  async getWalletById(userId: string, walletId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    return wallet ? mapWallet(wallet) : null;
  }

  async createWallet(userId: string, input: WalletCreateInput) {
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
        balance: input.initialBalance,
        initialBalance: input.initialBalance,
      },
    });

    return mapWallet(wallet);
  }

  async updateWallet(userId: string, walletId: string, input: WalletUpdateInput) {
    const wallet = await prisma.wallet.update({
      where: { id: walletId, userId },
      data: {
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
      },
    });

    return mapWallet(wallet);
  }

  async deleteWallet(userId: string, walletId: string) {
    await prisma.wallet.delete({
      where: { id: walletId, userId },
    });
  }

  async transferBalance(userId: string, input: WalletTransferInput) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sourceWallet = await tx.wallet.findFirst({
        where: { id: input.sourceWalletId, userId },
      });
      const destinationWallet = await tx.wallet.findFirst({
        where: { id: input.destinationWalletId, userId },
      });

      if (!sourceWallet || !destinationWallet) {
        throw new Error('Wallet sumber atau tujuan tidak ditemukan');
      }

      if (sourceWallet.id === destinationWallet.id) {
        throw new Error('Wallet sumber dan tujuan tidak boleh sama');
      }

      if (Number(sourceWallet.balance) < input.amount) {
        throw new Error('Saldo wallet sumber tidak cukup');
      }

      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { balance: { decrement: input.amount } },
      });

      await tx.wallet.update({
        where: { id: destinationWallet.id },
        data: { balance: { increment: input.amount } },
      });

      const note = input.note?.trim() || `Transfer ke ${destinationWallet.name}`;

      await tx.transaction.createMany({
        data: [
          {
            walletId: sourceWallet.id,
            destinationWalletId: destinationWallet.id,
            categoryId: null,
            type: 'TRANSFER',
            amount: input.amount,
            note: `${note} (keluar)`,
            transactionDate: new Date(),
          },
          {
            walletId: destinationWallet.id,
            categoryId: null,
            type: 'TRANSFER',
            amount: input.amount,
            note: `${note} (masuk)`,
            transactionDate: new Date(),
          },
        ],
      });
    });
  }

  async listRecentTransactions(userId: string, limit: number) {
    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: { userId },
      },
      include: {
        wallet: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });

    return transactions.map(mapTransaction);
  }
}