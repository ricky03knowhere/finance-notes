import 'server-only';

import { prisma } from '@/lib/prisma';
import type { ReportBudgetUsage, ReportCategoryMetric, ReportDashboard } from '@/features/report/report.types';

function toCategoryMetric(row: { name: string; amount: { toString(): string } }): ReportCategoryMetric {
  return {
    categoryName: row.name,
    amount: Number(row.amount),
  };
}

function toBudgetUsage(row: { categoryName: string; budgetAmount: { toString(): string }; spentAmount: number }): ReportBudgetUsage {
  const budgetAmount = Number(row.budgetAmount);

  return {
    categoryName: row.categoryName,
    budgetAmount,
    spentAmount: Math.min(row.spentAmount, budgetAmount),
    progress: budgetAmount > 0 ? Math.min(row.spentAmount / budgetAmount, 1) : 0,
  };
}

export interface ReportRepository {
  getDashboard(userId: string): Promise<ReportDashboard>;
}

export class PrismaReportRepository implements ReportRepository {
  async getDashboard(userId: string) {
    const [incomeRows, expenseRows, categoryRows, budgetRows, monthlyTrendRows, netWorthRow] = await Promise.all([
      prisma.$queryRawUnsafe<[{ amount: string }]>(
        `SELECT COALESCE(SUM(amount), 0) AS amount FROM transactions WHERE type = 'INCOME' AND wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)`,
        userId,
      ),
      prisma.$queryRawUnsafe<[{ amount: string }]>(
        `SELECT COALESCE(SUM(amount), 0) AS amount FROM transactions WHERE type = 'EXPENSE' AND wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)`,
        userId,
      ),
      prisma.$queryRawUnsafe<Array<{ name: string; amount: string }>>(
        `SELECT c.name, COALESCE(SUM(t.amount), 0) AS amount FROM transactions t JOIN categories c ON c.id = t.category_id WHERE t.wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND t.type = 'EXPENSE' GROUP BY c.name ORDER BY amount DESC LIMIT 5`,
        userId,
      ),
      prisma.$queryRawUnsafe<Array<{ categoryName: string; budgetAmount: string; spentAmount: number }>>(
        `SELECT c.name as categoryName, b.amount as budgetAmount, COALESCE(SUM(t.amount), 0) as spentAmount FROM budgets b JOIN categories c ON c.id = b.category_id LEFT JOIN transactions t ON t.category_id = c.id AND t.wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND t.type = 'EXPENSE' WHERE b.user_id = $1 GROUP BY c.name, b.amount ORDER BY spentAmount DESC LIMIT 5`,
        userId,
      ),
      prisma.$queryRawUnsafe<Array<{ label: string; income: string; expense: string }>>(
        `SELECT TO_CHAR(transaction_date, 'YYYY-MM') as label,
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as expense
         FROM transactions
         WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)
         AND transaction_date >= date_trunc('year', now())
         GROUP BY label
         ORDER BY label`,
        userId,
      ),
      prisma.$queryRawUnsafe<[{ amount: string }]>(
        `SELECT COALESCE(SUM(balance), 0) as amount FROM wallets WHERE user_id = $1`,
        userId,
      ),
    ]);

    const totalIncome = Number(incomeRows[0]?.amount ?? '0');
    const totalExpense = Number(expenseRows[0]?.amount ?? '0');
    const topCategories = categoryRows.map(toCategoryMetric);
    const budgetUsage = budgetRows.map(toBudgetUsage);
    const netWorth = Number(netWorthRow[0]?.amount ?? '0');

    return {
      summary: {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        netWorth,
        savingsTotal: Math.max(netWorth - totalExpense, 0),
        budgetCoverage: budgetUsage.length === 0 ? 0 : Math.round((budgetUsage.reduce((sum, row) => sum + row.progress, 0) / budgetUsage.length) * 100),
      },
      topCategories,
      budgetUsage,
      monthlyTrend: monthlyTrendRows.map((row) => ({
        label: row.label,
        income: Number(row.income),
        expense: Number(row.expense),
        netCashFlow: Number(row.income) - Number(row.expense),
      })),
    };
  }
}
