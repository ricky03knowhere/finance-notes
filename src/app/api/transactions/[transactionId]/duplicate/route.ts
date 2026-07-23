import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { transactionId } = await context.params;

    await transactionService.duplicateTransaction(user.id, transactionId);
    const dashboard = await transactionService.getDashboard(user.id);

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menggandakan transaksi';
    const isNotFound = message.includes('tidak ditemukan');
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 400 });
  }
}