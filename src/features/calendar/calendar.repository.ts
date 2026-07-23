import 'server-only';

import dayjs from 'dayjs';

import { prisma } from '@/lib/prisma';
import type { CalendarDashboard, CalendarDaySummary, CalendarEvent, YearlyRecap, YearlyRecapItem, YearlyRecapMonth } from '@/features/calendar/calendar.types';

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

const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

function buildYearlyRecapMonths(
  transactions: Array<{ amount: { toString(): string }; transactionDate: Date; type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; note: string | null }>,
): YearlyRecapMonth[] {
  const monthMap = new Map<number, { income: number; items: YearlyRecapItem[] }>();

  for (const tx of transactions) {
    const month = dayjs(tx.transactionDate).month(); // 0-indexed
    const entry = monthMap.get(month) ?? { income: 0, items: [] };

    if (tx.type === 'INCOME') {
      entry.income += Number(tx.amount);
    } else if (tx.type === 'EXPENSE') {
      entry.items.push({
        amount: Number(tx.amount),
        note: tx.note ?? '',
      });
    }

    monthMap.set(month, entry);
  }

  const months: YearlyRecapMonth[] = [];

  for (const [month, data] of monthMap) {
    const totalSpend = data.items.reduce((sum, item) => sum + item.amount, 0);

    months.push({
      month: month + 1, // 1-indexed for display
      monthLabel: MONTH_LABELS[month],
      income: data.income,
      totalSpend,
      left: data.income - totalSpend,
      items: data.items,
    });
  }

  return months.sort((a, b) => a.month - b.month);
}

export interface CalendarRepository {
  getDashboard(userId: string): Promise<CalendarDashboard>;
  getYearlyRecap(userId: string, year: number): Promise<YearlyRecap>;
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

  async getYearlyRecap(userId: string, year: number): Promise<YearlyRecap> {
    const yearStart = dayjs().year(year).startOf('year').toDate();
    const yearEnd = dayjs().year(year).endOf('year').toDate();

    const [transactions, yearRows] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          wallet: { userId },
          transactionDate: {
            gte: yearStart,
            lte: yearEnd,
          },
          type: { in: ['INCOME', 'EXPENSE'] },
        },
        select: {
          amount: true,
          transactionDate: true,
          type: true,
          note: true,
        },
        orderBy: { transactionDate: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { wallet: { userId } },
        select: { transactionDate: true },
        distinct: ['transactionDate'],
        orderBy: { transactionDate: 'asc' },
      }),
    ]);

    const availableYearsSet = new Set<number>();
    for (const row of yearRows) {
      availableYearsSet.add(dayjs(row.transactionDate).year());
    }

    const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

    if (!availableYears.includes(year)) {
      availableYears.unshift(year);
      availableYears.sort((a, b) => b - a);
    }

    return {
      year,
      months: buildYearlyRecapMonths(transactions),
      availableYears,
    };
  }
}

