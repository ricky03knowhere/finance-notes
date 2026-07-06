export type BudgetCategoryOption = {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
};

export interface BudgetRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryType: 'INCOME' | 'EXPENSE';
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  month: number;
  year: number;
  spentAmount: number;
  remainingAmount: number;
  progress: number;
}

export interface BudgetSummary {
  totalBudgets: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
}

export interface BudgetDashboard {
  summary: BudgetSummary;
  budgets: BudgetRecord[];
  categories: BudgetCategoryOption[];
}
