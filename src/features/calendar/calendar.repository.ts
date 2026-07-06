import 'server-only';

import dayjs from 'dayjs';

import { prisma } from '@/lib/prisma';
import type { CalendarDashboard, CalendarDaySummary, CalendarEvent } from '@/features/calendar/calendar.types';

function createEventFromTransaction(transaction: {
  id: string;
  amount: { toString(): string };
  transactionDate: Date;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: { name: string } | null;
  wallet: { name: string };
}): CalendarEvent {
  return {
    id: transaction.id,
    title: `${transaction.type === 'INCOME' ? 'Income' : transaction.type === 'EXPENSE' ? 'Expense' : 'Transfer'} — ${transaction.category?.name ?? transaction.wallet.name}`,
    type: 'transaction',
    date: transaction.transactionDate.toISOString(),
    amount: Number(transaction.amount),
    badge: transaction.type,
    categoryName: transaction.category?.name ?? null,
    walletName: transaction.wallet.name,
    status: transaction.type === 'EXPENSE' ? 'due' : 'completed',
  };
}

function createEventFromBill(bill: {
  id: string;
  title: string;
  amount: { toString(): string };
  dueDate: Date;
  paid: boolean;
}): CalendarEvent {
  return {
    id: bill.id,
    title: bill.title,
    type: 'bill',
    date: bill.dueDate.toISOString(),
    amount: Number(bill.amount),
    badge: bill.paid ? 'completed' : 'due',
    categoryName: null,
    walletName: null,
    status: bill.paid ? 'completed' : 'upcoming',
  };
}

function buildDailySummaries(transactions: Array<{ amount: { toString(): string }; transactionDate: Date; type: 'INCOME' | 'EXPENSE' | 'TRANSFER' }>): CalendarDaySummary[] {
  const summaryMap = new Map<string, CalendarDaySummary>();

  for (const transaction of transactions) {
    const date = dayjs(transaction.transactionDate).format('YYYY-MM-DD');
    const next = summaryMap.get(date) ?? { date, income: 0, expense: 0, count: 0 };

    if (transaction.type === 'INCOME') {
      next.income += Number(transaction.amount);
    }

    if (transaction.type === 'EXPENSE') {
      next.expense += Number(transaction.amount);
    }

    next.count += 1;
    summaryMap.set(date, next);
  }

  return Array.from(summaryMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface CalendarRepository {
  getDashboard(userId: string): Promise<CalendarDashboard>;
}

export class PrismaCalendarRepository implements CalendarRepository {
  async getDashboard(userId: string) {
    const now = dayjs();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();
    const upcomingLimit = now.add(30, 'day').endOf('day').toDate();

    const [transactions, bills] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          wallet: { userId },
          transactionDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          id: true,
          amount: true,
          transactionDate: true,
          type: true,
          category: { select: { name: true } },
          wallet: { select: { name: true } },
        },
        orderBy: { transactionDate: 'asc' },
      }),
      prisma.bill.findMany({
        where: {
          userId,
          dueDate: {
            gte: now.toDate(),
            lte: upcomingLimit,
          },
        },
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          amount: true,
          dueDate: true,
          paid: true,
        },
      }),
    ]);

    const events: CalendarEvent[] = [
      ...bills.map(createEventFromBill),
      ...transactions.map(createEventFromTransaction),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const weekStart = now.startOf('week').toDate();
    const weekEnd = now.endOf('week').toDate();

    const weekStartTime = weekStart.getTime();
    const weekEndTime = weekEnd.getTime();
    const weekTransactions = transactions.filter((transaction) => {
      const transactionTime = new Date(transaction.transactionDate).getTime();
      return transactionTime >= weekStartTime && transactionTime <= weekEndTime;
    });

    const weeklyIncome = weekTransactions.reduce((sum, transaction) => {
      return transaction.type === 'INCOME' ? sum + Number(transaction.amount) : sum;
    }, 0);

    const weeklyExpense = weekTransactions.reduce((sum, transaction) => {
      return transaction.type === 'EXPENSE' ? sum + Number(transaction.amount) : sum;
    }, 0);

    const weeklyBills = bills.filter((bill) => {
      const billTime = new Date(bill.dueDate).getTime();
      return billTime >= weekStartTime && billTime <= weekEndTime;
    }).length;

    const transactionCountByType = ['INCOME', 'EXPENSE', 'TRANSFER'].map((type) => ({
      label: type === 'INCOME' ? 'Income' : type === 'EXPENSE' ? 'Expense' : 'Transfer',
      value: transactions.filter((transaction) => transaction.type === type).length,
    }));

    return {
      summary: {
        upcomingBills: bills.length,
        upcomingBillAmount: bills.reduce((sum, bill) => sum + Number(bill.amount), 0),
        activeDays: new Set(transactions.map((transaction) => dayjs(transaction.transactionDate).format('YYYY-MM-DD'))).size,
        currentMonthEvents: transactions.length,
      },
      events,
      dailyActivity: buildDailySummaries(transactions),
      weeklySummary: [
        { label: 'Weekly Income', value: weeklyIncome },
        { label: 'Weekly Expense', value: weeklyExpense },
        { label: 'Weekly Transactions', value: weekTransactions.length },
        { label: 'Due Bills This Week', value: weeklyBills },
      ],
      monthlyTransactions: transactionCountByType,
    };
  }
}
