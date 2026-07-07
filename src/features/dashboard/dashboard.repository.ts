import 'server-only';

import dayjs from 'dayjs';

import { prisma } from '@/lib/prisma';
import type { Dashboard, IncomeExpensePoint } from '@/features/dashboard/dashboard.types';

export interface DashboardRepository {
  getDashboard(userId: string): Promise<Dashboard>;
}

export class PrismaDashboardRepository implements DashboardRepository {
  async getDashboard(userId: string) {
    const now = dayjs();
    const sixMonthsAgo = now.subtract(5, 'month').startOf('month').toDate();

    const [balanceRow, incomeRow, expenseRow, topCategoriesRows, monthlyTrendRows, recentTransactions, upcomingBillsRows, budgetRows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ amount: string }]>(`SELECT COALESCE(SUM(balance), 0) as amount FROM wallets WHERE user_id = $1`, userId),
      prisma.$queryRawUnsafe<[{ amount: string }]>(`SELECT COALESCE(SUM(amount), 0) as amount FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'INCOME'`, userId),
      prisma.$queryRawUnsafe<[{ amount: string }]>(`SELECT COALESCE(SUM(amount), 0) as amount FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND type = 'EXPENSE'`, userId),
      prisma.$queryRawUnsafe<Array<{ name: string; amount: string }>>(
        `SELECT c.name, COALESCE(SUM(t.amount), 0) AS amount FROM transactions t JOIN categories c ON c.id = t.category_id WHERE t.wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND t.type = 'EXPENSE' GROUP BY c.name ORDER BY amount DESC LIMIT 5`,
        userId,
      ),
      prisma.$queryRawUnsafe<Array<{ label: string; income: string; expense: string }>>(
        `SELECT TO_CHAR(transaction_date, 'YYYY-MM') as label,
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END),0) as income,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END),0) as expense
         FROM transactions
         WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)
         AND transaction_date >= $2
         GROUP BY label
         ORDER BY label`,
        userId,
        sixMonthsAgo,
      ),
      prisma.transaction.findMany({
        where: { wallet: { userId } },
        orderBy: { transactionDate: 'desc' },
        select: { id: true, amount: true, transactionDate: true, type: true, category: { select: { name: true } }, wallet: { select: { name: true } } },
        take: 5,
      }),
      prisma.bill.findMany({ where: { userId, dueDate: { gte: now.toDate() } }, orderBy: { dueDate: 'asc' }, select: { id: true, title: true, amount: true, dueDate: true, paid: true }, take: 5 }),
      prisma.$queryRawUnsafe<Array<{ categoryName: string; budgetAmount: string; spentAmount: number }>>(
        `SELECT c.name as categoryName, b.amount as budgetAmount, COALESCE(SUM(t.amount), 0) as spentAmount FROM budgets b JOIN categories c ON c.id = b.category_id LEFT JOIN transactions t ON t.category_id = c.id AND t.wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) AND t.type = 'EXPENSE' WHERE b.user_id = $1 GROUP BY c.name, b.amount ORDER BY spentAmount DESC LIMIT 5`,
        userId,
      ),
    ]);

    const totalBalance = Number(balanceRow[0]?.amount ?? '0');
    const totalIncome = Number(incomeRow[0]?.amount ?? '0');
    const totalExpense = Number(expenseRow[0]?.amount ?? '0');

    const topCategories = topCategoriesRows.map((r) => ({ categoryName: r.name, amount: Number(r.amount) }));

    const incomeExpenseTrend: IncomeExpensePoint[] = monthlyTrendRows.map((r) => ({ label: r.label, income: Number(r.income), expense: Number(r.expense) }));

    const recentTx = (recentTransactions ?? []).map((t) => ({
      id: t.id,
      title: `${t.type === 'INCOME' ? 'Income' : t.type === 'EXPENSE' ? 'Expense' : 'Transfer'} — ${t.category?.name ?? t.wallet.name}`,
      type: t.type,
      transactionDate: t.transactionDate.toISOString(),
      amount: Number(t.amount),
      categoryName: t.category?.name ?? null,
      walletName: t.wallet.name ?? null,
    }));

    const upcoming = (upcomingBillsRows ?? []).map((b) => ({ id: b.id, title: b.title, dueDate: b.dueDate.toISOString(), amount: Number(b.amount), paid: b.paid }));

    const budgetProgress = (budgetRows ?? []).map((b) => {
      const budgetAmount = Number(b.budgetAmount);
      const spentAmount = Number(b.spentAmount ?? 0);
      return {
        categoryName: b.categoryName,
        budgetAmount,
        spentAmount,
        progress: budgetAmount > 0 ? Math.min(1, spentAmount / budgetAmount) : 0,
      };
    });

    const monthlyCashFlow = incomeExpenseTrend.reduce((sum, p) => sum + (p.income - p.expense), 0);

    return {
      summary: {
        totalBalance,
        totalIncome,
        totalExpense,
        savings: Math.max(totalBalance - totalExpense, 0),
        monthlyCashFlow,
      },
      topCategories,
      incomeExpenseTrend,
      recentTransactions: recentTx,
      upcomingBills: upcoming,
      budgetProgress,
    };
  }
}

export const dashboardRepository = new PrismaDashboardRepository();
