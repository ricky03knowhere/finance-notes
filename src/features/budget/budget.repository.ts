import 'server-only';

import dayjs from 'dayjs';

import { prisma } from '@/lib/prisma';
import type { BudgetCreateInput, BudgetUpdateInput } from '@/features/budget/budget.schema';
import type { BudgetCategoryOption, BudgetRecord } from '@/features/budget/budget.types';

type BudgetRow = {
  id: string;
  categoryId: string;
  amount: { toString(): string };
  month: number;
  year: number;
  category: {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
    icon: string;
  };
};

function mapBudget(budget: BudgetRow, spentAmount: number): BudgetRecord {
  const amount = Number(budget.amount);
  const remainingAmount = Math.max(amount - spentAmount, 0);

  return {
    id: budget.id,
    categoryId: budget.categoryId,
    categoryName: budget.category.name,
    categoryType: budget.category.type,
    categoryColor: budget.category.color,
    categoryIcon: budget.category.icon,
    amount,
    month: budget.month,
    year: budget.year,
    spentAmount,
    remainingAmount,
    progress: amount > 0 ? Math.min(spentAmount / amount, 1) : 0,
  };
}

function mapCategoryOption(category: {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
}): BudgetCategoryOption {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
  };
}

export interface BudgetRepository {
  listBudgets(userId: string): Promise<BudgetRecord[]>;
  createBudget(userId: string, input: BudgetCreateInput): Promise<BudgetRecord>;
  updateBudget(userId: string, budgetId: string, input: BudgetUpdateInput): Promise<BudgetRecord>;
  deleteBudget(userId: string, budgetId: string): Promise<void>;
  listCategoryOptions(userId: string): Promise<BudgetCategoryOption[]>;
}

export class PrismaBudgetRepository implements BudgetRepository {
  async listBudgets(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    if (budgets.length === 0) {
      return [];
    }

    const categoryIds = budgets.map((budget) => budget.categoryId);
    const firstBudget = budgets[budgets.length - 1];
    const lastBudget = budgets[0];

    const rangeStart = dayjs(new Date(firstBudget.year, firstBudget.month - 1, 1));
    const rangeEnd = dayjs(new Date(lastBudget.year, lastBudget.month - 1, 1))
      .endOf('month')
      .add(1, 'millisecond');

    const transactions = await prisma.transaction.findMany({
      where: {
        categoryId: { in: categoryIds },
        wallet: { userId },
        transactionDate: {
          gte: rangeStart.toDate(),
          lte: rangeEnd.toDate(),
        },
      },
      select: {
        categoryId: true,
        amount: true,
        transactionDate: true,
        type: true,
      },
    });

    function getSpentAmount(budget: BudgetRow) {
      return transactions.reduce((sum, transaction) => {
        const transactionDate = dayjs(transaction.transactionDate);
        if (
          transaction.categoryId !== budget.categoryId ||
          transactionDate.month() + 1 !== budget.month ||
          transactionDate.year() !== budget.year
        ) {
          return sum;
        }

        if (budget.category.type === 'EXPENSE' && transaction.type !== 'EXPENSE') {
          return sum;
        }

        if (budget.category.type === 'INCOME' && transaction.type !== 'INCOME') {
          return sum;
        }

        return sum + Number(transaction.amount);
      }, 0);
    }

    return budgets.map((budget) => mapBudget(budget, getSpentAmount(budget)));
  }

  async createBudget(userId: string, input: BudgetCreateInput) {
    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: input.categoryId,
        amount: input.amount,
        month: input.month,
        year: input.year,
      },
      include: { category: true },
    });

    return mapBudget(budget, 0);
  }

  async updateBudget(userId: string, budgetId: string, input: BudgetUpdateInput) {
    const budget = await prisma.budget.updateMany({
      where: { id: budgetId, userId },
      data: {
        categoryId: input.categoryId,
        amount: input.amount,
        month: input.month,
        year: input.year,
      },
    });

    if (budget.count === 0) {
      throw new Error('Budget tidak ditemukan');
    }

    const refreshedBudget = await prisma.budget.findFirstOrThrow({
      where: { id: budgetId, userId },
      include: { category: true },
    });

    return mapBudget(refreshedBudget, 0);
  }

  async deleteBudget(userId: string, budgetId: string) {
    await prisma.budget.deleteMany({
      where: { id: budgetId, userId },
    });
  }

  async listCategoryOptions(userId: string) {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return categories.map(mapCategoryOption);
  }
}
