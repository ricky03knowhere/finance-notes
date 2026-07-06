import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { savingGoalService } from '@/features/saving-goal/saving-goal.service';
import { savingGoalUpdateSchema } from '@/features/saving-goal/saving-goal.schema';

type RouteContext = {
  params: Promise<{ savingGoalId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { savingGoalId } = await context.params;
  const body = await request.json();
  const input = savingGoalUpdateSchema.parse(body);

  await savingGoalService.updateSavingGoal(user.id, savingGoalId, input);
  const dashboard = await savingGoalService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { savingGoalId } = await context.params;

  await savingGoalService.deleteSavingGoal(user.id, savingGoalId);
  const dashboard = await savingGoalService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}
