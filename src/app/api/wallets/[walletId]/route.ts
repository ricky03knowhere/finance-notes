import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { walletService } from '@/features/wallet/wallet.service';
import { walletUpdateSchema } from '@/features/wallet/wallet.schema';

type RouteContext = {
  params: Promise<{ walletId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { walletId } = await context.params;
  const body = await request.json();
  const input = walletUpdateSchema.parse(body);

  await walletService.updateWallet(user.id, walletId, input);
  const dashboard = await walletService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { walletId } = await context.params;

  await walletService.deleteWallet(user.id, walletId);
  const dashboard = await walletService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}