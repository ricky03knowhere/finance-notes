export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionSortBy = 'transactionDate' | 'amount' | 'createdAt';
export type TransactionSortDirection = 'asc' | 'desc';

export interface TransactionOption {
  id: string;
  name: string;
  color: string;
  icon: string;
  type?: string;
}

export interface TransactionRecord {
  id: string;
  walletId: string;
  walletName: string;
  walletColor: string;
  destinationWalletId: string | null;
  destinationWalletName: string | null;
  destinationWalletColor: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  transactionDate: string;
  attachment: string | null;
  location: string | null;
  tagNames: string[];
  createdAt: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  netCashFlow: number;
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionQueryState {
  search: string;
  type: 'ALL' | TransactionType;
  walletId: string;
  categoryId: string;
  page: number;
  pageSize: number;
  sortBy: TransactionSortBy;
  sortDirection: TransactionSortDirection;
}

export interface TransactionDashboard {
  summary: TransactionSummary;
  transactions: TransactionRecord[];
  pagination: TransactionPagination;
  filters: TransactionQueryState;
  wallets: TransactionOption[];
  categories: TransactionOption[];
}