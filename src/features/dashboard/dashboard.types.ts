export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  monthlyCashFlow: number;
}

export interface TopCategory {
  categoryName: string;
  amount: number;
}

export interface IncomeExpensePoint {
  label: string;
  income: number;
  expense: number;
}

export interface RecentTransaction {
  id: string;
  title: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  transactionDate: string;
  amount: number;
  categoryName: string | null;
  walletName: string | null;
}

export interface UpcomingBill {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  paid: boolean;
}

export interface BudgetProgress {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  progress: number;
}

export interface Dashboard {
  summary: DashboardSummary;
  topCategories: TopCategory[];
  incomeExpenseTrend: IncomeExpensePoint[];
  recentTransactions: RecentTransaction[];
  upcomingBills: UpcomingBill[];
  budgetProgress: BudgetProgress[];
}
