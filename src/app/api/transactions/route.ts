import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';
import { transactionMutationSchema } from '@/features/transaction/transaction.schema';

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const dashboard = await transactionService.getDashboard(user.id, Object.fromEntries(url.searchParams));

  return NextResponse.json({ dashboard });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = transactionMutationSchema.parse(body);

    await transactionService.createTransaction(user.id, input);
    const dashboard = await transactionService.getDashboard(user.id);

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    const message = error instanceof ZodError
      ? error.issues[0]?.message ?? 'Data transaksi tidak valid'
      : error instanceof Error
        ? error.message
        : 'Gagal membuat transaksi';

    const status = error instanceof ZodError ? 400 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}