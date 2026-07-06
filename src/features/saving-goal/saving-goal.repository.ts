import 'server-only';

import { prisma } from '@/lib/prisma';
import type { SavingGoalCreateInput, SavingGoalUpdateInput } from '@/features/saving-goal/saving-goal.schema';
import type { SavingGoalRecord } from '@/features/saving-goal/saving-goal.types';

type SavingGoalRow = {
  id: string;
  title: string;
  targetAmount: { toString(): string };
  currentAmount: { toString(): string };
  deadline: Date;
};

function mapSavingGoal(goal: SavingGoalRow): SavingGoalRecord {
  const targetAmount = Number(goal.targetAmount);
  const currentAmount = Number(goal.currentAmount);
  const progress = targetAmount > 0 ? Math.min(currentAmount / targetAmount, 1) : 0;

  return {
    id: goal.id,
    title: goal.title,
    targetAmount,
    currentAmount,
    deadline: goal.deadline.toISOString(),
    progress,
    completed: currentAmount >= targetAmount,
  };
}

export interface SavingGoalRepository {
  listSavingGoals(userId: string): Promise<SavingGoalRecord[]>;
  createSavingGoal(userId: string, input: SavingGoalCreateInput): Promise<SavingGoalRecord>;
  updateSavingGoal(userId: string, savingGoalId: string, input: SavingGoalUpdateInput): Promise<SavingGoalRecord>;
  deleteSavingGoal(userId: string, savingGoalId: string): Promise<void>;
}

export class PrismaSavingGoalRepository implements SavingGoalRepository {
  async listSavingGoals(userId: string) {
    const goals = await prisma.savingGoal.findMany({
      where: { userId },
      orderBy: { deadline: 'asc' },
    });

    return goals.map(mapSavingGoal);
  }

  async createSavingGoal(userId: string, input: SavingGoalCreateInput) {
    const goal = await prisma.savingGoal.create({
      data: {
        userId,
        title: input.title,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount,
        deadline: new Date(input.deadline),
      },
    });

    return mapSavingGoal(goal);
  }

  async updateSavingGoal(userId: string, savingGoalId: string, input: SavingGoalUpdateInput) {
    const goal = await prisma.savingGoal.updateMany({
      where: { id: savingGoalId, userId },
      data: {
        title: input.title,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount,
        deadline: new Date(input.deadline),
      },
    });

    if (goal.count === 0) {
      throw new Error('Saving goal tidak ditemukan');
    }

    const refreshed = await prisma.savingGoal.findFirstOrThrow({ where: { id: savingGoalId, userId } });
    return mapSavingGoal(refreshed);
  }

  async deleteSavingGoal(userId: string, savingGoalId: string) {
    await prisma.savingGoal.deleteMany({ where: { id: savingGoalId, userId } });
  }
}
