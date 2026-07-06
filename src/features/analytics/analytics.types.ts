export interface AnalyticsSummary {
  topExpenseCategory: string;
  highestExpense: number;
  averageDailySpending: number;
  monthlyTrend: number;
  financialHealthScore: number;
}

export interface AnalyticsTrendPoint {
  label: string;
  value: number;
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary;
  expenseGrowth: AnalyticsTrendPoint[];
  savingsGrowth: AnalyticsTrendPoint[];
  monthlyTrend: AnalyticsTrendPoint[];
  yearlyTrend: AnalyticsTrendPoint[];
}
