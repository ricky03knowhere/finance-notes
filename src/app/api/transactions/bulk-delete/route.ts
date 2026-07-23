import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';
import { transactionBulkDeleteSchema } from '@/features/transaction/transaction.schema';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = transactionBulkDeleteSchema.parse(body);

    const deletedCount = await transactionService.bulkDeleteTransactions(user.id, input);
    const dashboard = await transactionService.getDashboard(user.id);

    return NextResponse.json({ dashboard, deletedCount });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Data transaksi tidak valid' }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Gagal menghapus transaksi terpilih';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}