import 'server-only';

import { PrismaWalletRepository } from '@/features/wallet/wallet.repository';
import {
  walletCreateSchema,
  walletTransferSchema,
  walletUpdateSchema,
  type WalletCreateInput,
  type WalletTransferInput,
  type WalletUpdateInput,
} from '@/features/wallet/wallet.schema';
import type { WalletDashboard, WalletSummary } from '@/features/wallet/wallet.types';

const walletRepository = new PrismaWalletRepository();

function calculateSummary(wallets: WalletDashboard['wallets']): WalletSummary {
  return wallets.reduce<WalletSummary>(
    (summary, wallet) => {
      const updatedSummary = {
        ...summary,
        totalBalance: summary.totalBalance + wallet.balance,
        walletCount: summary.walletCount + 1,
      };

      if (wallet.type === 'CASH') {
        updatedSummary.cashBalance += wallet.balance;
      }

      if (wallet.type === 'BANK') {
        updatedSummary.bankBalance += wallet.balance;
      }

      if (wallet.type === 'E_WALLET') {
        updatedSummary.eWalletBalance += wallet.balance;
      }

      if (wallet.type === 'CREDIT_CARD') {
        updatedSummary.creditCardBalance += wallet.balance;
      }

      return updatedSummary;
    },
    {
      totalBalance: 0,
      walletCount: 0,
      cashBalance: 0,
      bankBalance: 0,
      eWalletBalance: 0,
      creditCardBalance: 0,
    },
  );
}

export class WalletService {
  async getDashboard(userId: string): Promise<WalletDashboard> {
    const [wallets, recentTransactions] = await Promise.all([
      walletRepository.listWallets(userId),
      walletRepository.listRecentTransactions(userId, 6),
    ]);

    return {
      summary: calculateSummary(wallets),
      wallets,
      recentTransactions,
    };
  }

  async createWallet(userId: string, input: WalletCreateInput) {
    const parsed = walletCreateSchema.parse(input);
    return walletRepository.createWallet(userId, parsed);
  }

  async updateWallet(userId: string, walletId: string, input: WalletUpdateInput) {
    const parsed = walletUpdateSchema.parse(input);
    return walletRepository.updateWallet(userId, walletId, parsed);
  }

  async deleteWallet(userId: string, walletId: string) {
    return walletRepository.deleteWallet(userId, walletId);
  }

  async transferBalance(userId: string, input: WalletTransferInput) {
    const parsed = walletTransferSchema.parse(input);
    return walletRepository.transferBalance(userId, parsed);
  }
}

export const walletService = new WalletService();