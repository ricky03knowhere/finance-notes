import 'server-only';

import dayjs from 'dayjs';

import { prisma } from '@/lib/prisma';
import type { AnalyticsDashboard, AnalyticsTrendPoint } from '@/features/analytics/analytics.types';

function toTrendPoint(row: { label: string; value: string | null }): AnalyticsTrendPoint {
  return {
    label: row.label,
    value: Number(row.value ?? '0'),
  };
}

export interface AnalyticsRepository {
  getDashboard(userId: string): Promise<AnalyticsDashboard>;
}

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getDashboard(userId: string) {
    const today = dayjs();
    const startOfMonth = today.startOf('month').toDate();
    const startOfPreviousMonth = today.subtract(1, 'month').startOf('month').toDate();

    const [topExpenseRow, totalIncomeRow, totalExpenseRow, dailySpendingRows, monthlyExpenseRows, yearlyExpenseRows, savingsRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ label: string; value: string }>>(
        `SELECT c.name as label, COALESCE(SUM(t.amount), 0) as value FROM transactions t JOIN categories c ON c.id = t.category_id WHERE t.wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND t.type = 'EXPENSE' GROUP BY c.name ORDER BY value DESC LIMIT 1`,
        userId,
      ),
      prisma.$queryRawUnsafe<[{ amount: string }]>(
        `SELECT COALESCE(SUM(amount), 0) as amount FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'INCOME'`,
        userId,
      ),
      prisma.$queryRawUnsafe<[{ amount: string }]>(
        `SELECT COALESCE(SUM(amount), 0) as amount FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'EXPENSE'`,
        userId,
      ),
      prisma.$queryRawUnsafe<Array<{ label: string; value: string }>>(
        `SELECT TO_CHAR(transaction_date, 'YYYY-MM-DD') as label, COALESCE(SUM(amount), 0) as value FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'EXPENSE' AND transaction_date >= $2 GROUP BY label ORDER BY label`,
        userId,
        startOfMonth,
      ),
      prisma.$queryRawUnsafe<Array<{ label: string; value: string }>>(
        `SELECT TO_CHAR(transaction_date, 'YYYY-MM') as label, COALESCE(SUM(amount), 0) as value FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'EXPENSE' AND transaction_date >= $2 GROUP BY label ORDER BY label`,
        userId,
        startOfPreviousMonth,
      ),
      prisma.$queryRawUnsafe<Array<{ label: string; value: string }>>(
        `SELECT TO_CHAR(transaction_date, 'YYYY') as label, COALESCE(SUM(amount), 0) as value FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'EXPENSE' AND transaction_date >= date_trunc('year', now()) - INTERVAL '12 months' GROUP BY label ORDER BY label`,
        userId,
      ),
      prisma.$queryRawUnsafe<Array<{ label: string; value: string }>>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM') as label, COALESCE(SUM(balance), 0) as value FROM wallets WHERE user_id = $1 GROUP BY label ORDER BY label`,
        userId,
      ),
    ]);

    const topExpenseCategory = topExpenseRow[0]?.label ?? 'Tidak ada';
    const highestExpense = Number(topExpenseRow[0]?.value ?? '0');
    const totalIncome = Number(totalIncomeRow[0]?.amount ?? '0');
    const totalExpense = Number(totalExpenseRow[0]?.amount ?? '0');
    const averageDailySpending = dailySpendingRows.length === 0 ? 0 : dailySpendingRows.reduce((sum, row) => sum + Number(row.value), 0) / dailySpendingRows.length;
    const monthlyTrend = monthlyExpenseRows.reduce((sum, row) => sum + Number(row.value), 0);
    const expenseRatio = totalIncome > 0 ? Math.min(1, totalExpense / totalIncome) : 1;
    const savingsRatio = totalIncome > 0 ? Math.max(0, Math.min(1, (totalIncome - totalExpense) / totalIncome)) : 0;
    const financialHealthScore = Math.round((1 - expenseRatio) * 50 + savingsRatio * 50);

    return {
      summary: {
        topExpenseCategory,
        highestExpense,
        averageDailySpending: Math.round(averageDailySpending),
        monthlyTrend,
        financialHealthScore,
      },
      expenseGrowth: monthlyExpenseRows.map(toTrendPoint),
      savingsGrowth: savingsRows.map(toTrendPoint),
      monthlyTrend: monthlyExpenseRows.map(toTrendPoint),
      yearlyTrend: yearlyExpenseRows.map(toTrendPoint),
    };
  }
}
