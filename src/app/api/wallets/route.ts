import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { walletService } from '@/features/wallet/wallet.service';
import { walletCreateSchema } from '@/features/wallet/wallet.schema';

export async function GET() {
  const user = await requireUser();
  const dashboard = await walletService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const input = walletCreateSchema.parse(body);

  await walletService.createWallet(user.id, input);
  const dashboard = await walletService.getDashboard(user.id);

  return NextResponse.json({ dashboard }, { status: 201 });
}