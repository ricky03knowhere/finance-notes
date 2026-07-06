export type CategoryType = 'INCOME' | 'EXPENSE';

export interface CategoryRecord {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  transactionCount: number;
}

export interface CategorySummary {
  totalCategories: number;
  incomeCategories: number;
  expenseCategories: number;
}

export interface CategoryDashboard {
  summary: CategorySummary;
  categories: CategoryRecord[];
}