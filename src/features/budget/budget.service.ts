import 'server-only';

import { PrismaBudgetRepository } from '@/features/budget/budget.repository';
import { budgetCreateSchema, budgetUpdateSchema, type BudgetCreateInput, type BudgetUpdateInput } from '@/features/budget/budget.schema';
import type { BudgetDashboard, BudgetSummary } from '@/features/budget/budget.types';

const budgetRepository = new PrismaBudgetRepository();

function createSummary(budgets: BudgetDashboard['budgets']): BudgetSummary {
  const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpentAmount = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);

  return {
    totalBudgets: budgets.length,
    totalBudgetAmount,
    totalSpentAmount,
    totalRemainingAmount: Math.max(totalBudgetAmount - totalSpentAmount, 0),
  };
}

export class BudgetService {
  async getDashboard(userId: string): Promise<BudgetDashboard> {
    const [budgets, categories] = await Promise.all([
      budgetRepository.listBudgets(userId),
      budgetRepository.listCategoryOptions(userId),
    ]);

    return {
      summary: createSummary(budgets),
      budgets,
      categories,
    };
  }

  async createBudget(userId: string, input: BudgetCreateInput) {
    const parsed = budgetCreateSchema.parse(input);
    return budgetRepository.createBudget(userId, parsed);
  }

  async updateBudget(userId: string, budgetId: string, input: BudgetUpdateInput) {
    const parsed = budgetUpdateSchema.parse(input);
    return budgetRepository.updateBudget(userId, budgetId, parsed);
  }

  async deleteBudget(userId: string, budgetId: string) {
    return budgetRepository.deleteBudget(userId, budgetId);
  }
}

export const budgetService = new BudgetService();