import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { walletService } from '@/features/wallet/wallet.service';
import { walletTransferSchema } from '@/features/wallet/wallet.schema';

type RouteContext = {
  params: Promise<{ walletId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { walletId } = await context.params;
  const body = await request.json();
  const input = walletTransferSchema.parse({ ...body, sourceWalletId: walletId });

  await walletService.transferBalance(user.id, input);
  const dashboard = await walletService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}