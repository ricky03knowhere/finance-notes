export type WalletType = 'CASH' | 'BANK' | 'E_WALLET' | 'CREDIT_CARD';

export interface WalletRecord {
  id: string;
  name: string;
  type: WalletType;
  icon: string;
  color: string;
  balance: number;
  initialBalance: number;
  createdAt: string;
}

export interface WalletTransactionRecord {
  id: string;
  walletId: string;
  walletName: string;
  walletColor: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  note: string | null;
  transactionDate: string;
}

export interface WalletSummary {
  totalBalance: number;
  walletCount: number;
  cashBalance: number;
  bankBalance: number;
  eWalletBalance: number;
  creditCardBalance: number;
}

export interface WalletDashboard {
  summary: WalletSummary;
  wallets: WalletRecord[];
  recentTransactions: WalletTransactionRecord[];
}

export interface WalletTransferResult {
  sourceWalletId: string;
  destinationWalletId: string;
}