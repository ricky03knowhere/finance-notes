import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';
import { transactionBulkDeleteSchema } from '@/features/transaction/transaction.schema';

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const input = transactionBulkDeleteSchema.parse(body);

  const deletedCount = await transactionService.bulkDeleteTransactions(user.id, input);
  const dashboard = await transactionService.getDashboard(user.id);

  return NextResponse.json({ dashboard, deletedCount });
}