import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { savingGoalService } from '@/features/saving-goal/saving-goal.service';
import { savingGoalCreateSchema } from '@/features/saving-goal/saving-goal.schema';

export async function GET() {
  const user = await requireUser();
  const dashboard = await savingGoalService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const input = savingGoalCreateSchema.parse(body);

  await savingGoalService.createSavingGoal(user.id, input);
  const dashboard = await savingGoalService.getDashboard(user.id);

  return NextResponse.json({ dashboard }, { status: 201 });
}
