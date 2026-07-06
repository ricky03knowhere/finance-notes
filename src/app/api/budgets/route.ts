import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { budgetService } from '@/features/budget/budget.service';
import { budgetCreateSchema } from '@/features/budget/budget.schema';

export async function GET() {
  const user = await requireUser();
  const dashboard = await budgetService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const input = budgetCreateSchema.parse(body);

  await budgetService.createBudget(user.id, input);
  const dashboard = await budgetService.getDashboard(user.id);

  return NextResponse.json({ dashboard }, { status: 201 });
}
