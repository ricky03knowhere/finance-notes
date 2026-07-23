import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';
import { transactionMutationSchema } from '@/features/transaction/transaction.schema';

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

function formatErrorMessage(error: unknown, defaultMessage: string): { message: string; status: number } {
  if (error instanceof ZodError) {
    return { message: error.issues[0]?.message ?? 'Data transaksi tidak valid', status: 400 };
  }

  const rawMessage = error instanceof Error ? error.message : defaultMessage;

  if (rawMessage.includes('tidak ditemukan') || rawMessage.includes('Transaction API error') || rawMessage.includes('Record to update not found')) {
    return { message: 'Transaksi tidak ditemukan atau telah dihapus', status: 404 };
  }

  if (rawMessage.includes('Saldo') || rawMessage.includes('wallet')) {
    return { message: rawMessage, status: 400 };
  }

  return { message: rawMessage, status: 400 };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { transactionId } = await context.params;
    const body = await request.json();
    const input = transactionMutationSchema.parse(body);

    await transactionService.updateTransaction(user.id, transactionId, input);
    const dashboard = await transactionService.getDashboard(user.id);

    return NextResponse.json({ dashboard });
  } catch (error) {
    const { message, status } = formatErrorMessage(error, 'Gagal memperbarui transaksi');
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { transactionId } = await context.params;

    await transactionService.deleteTransaction(user.id, transactionId);
    const dashboard = await transactionService.getDashboard(user.id);

    return NextResponse.json({ dashboard });
  } catch (error) {
    const { message, status } = formatErrorMessage(error, 'Gagal menghapus transaksi');
    return NextResponse.json({ error: message }, { status });
  }
}