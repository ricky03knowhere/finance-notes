import 'server-only';

import { PrismaSavingGoalRepository } from '@/features/saving-goal/saving-goal.repository';
import {
  savingGoalCreateSchema,
  savingGoalUpdateSchema,
  type SavingGoalCreateInput,
  type SavingGoalUpdateInput,
} from '@/features/saving-goal/saving-goal.schema';
import type { SavingGoalDashboard, SavingGoalSummary } from '@/features/saving-goal/saving-goal.types';

const savingGoalRepository = new PrismaSavingGoalRepository();

function createSummary(goals: SavingGoalDashboard['savingGoals']): SavingGoalSummary {
  const totalGoals = goals.length;
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const averageProgress = totalGoals > 0 ? goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals : 0;

  return {
    totalGoals,
    totalTarget,
    totalSaved,
    averageProgress,
  };
}

export class SavingGoalService {
  async getDashboard(userId: string): Promise<SavingGoalDashboard> {
    const savingGoals = await savingGoalRepository.listSavingGoals(userId);

    return {
      summary: createSummary(savingGoals),
      savingGoals,
    };
  }

  async createSavingGoal(userId: string, input: SavingGoalCreateInput) {
    const parsed = savingGoalCreateSchema.parse(input);
    return savingGoalRepository.createSavingGoal(userId, parsed);
  }

  async updateSavingGoal(userId: string, savingGoalId: string, input: SavingGoalUpdateInput) {
    const parsed = savingGoalUpdateSchema.parse(input);
    return savingGoalRepository.updateSavingGoal(userId, savingGoalId, parsed);
  }

  async deleteSavingGoal(userId: string, savingGoalId: string) {
    return savingGoalRepository.deleteSavingGoal(userId, savingGoalId);
  }
}

export const savingGoalService = new SavingGoalService();
