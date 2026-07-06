import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { budgetService } from '@/features/budget/budget.service';
import { budgetUpdateSchema } from '@/features/budget/budget.schema';

type RouteContext = {
  params: Promise<{ budgetId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { budgetId } = await context.params;
  const body = await request.json();
  const input = budgetUpdateSchema.parse(body);

  await budgetService.updateBudget(user.id, budgetId, input);
  const dashboard = await budgetService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { budgetId } = await context.params;

  await budgetService.deleteBudget(user.id, budgetId);
  const dashboard = await budgetService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}
