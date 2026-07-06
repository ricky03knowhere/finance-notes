export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  netWorth: number;
  savingsTotal: number;
  budgetCoverage: number;
}

export interface ReportCategoryMetric {
  categoryName: string;
  amount: number;
}

export interface ReportMonthlyTrend {
  label: string;
  income: number;
  expense: number;
  netCashFlow: number;
}

export interface ReportBudgetUsage {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  progress: number;
}

export interface ReportDashboard {
  summary: ReportSummary;
  topCategories: ReportCategoryMetric[];
  monthlyTrend: ReportMonthlyTrend[];
  budgetUsage: ReportBudgetUsage[];
}
