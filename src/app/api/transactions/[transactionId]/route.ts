import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';
import { transactionMutationSchema } from '@/features/transaction/transaction.schema';

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { transactionId } = await context.params;
  const body = await request.json();
  const input = transactionMutationSchema.parse(body);

  await transactionService.updateTransaction(user.id, transactionId, input);
  const dashboard = await transactionService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { transactionId } = await context.params;

  await transactionService.deleteTransaction(user.id, transactionId);
  const dashboard = await transactionService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}