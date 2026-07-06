import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { billService } from '@/features/bill/bill.service';
import { billCreateSchema } from '@/features/bill/bill.schema';

export async function GET() {
  const user = await requireUser();
  const dashboard = await billService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const input = billCreateSchema.parse(body);

  await billService.createBill(user.id, input);
  const dashboard = await billService.getDashboard(user.id);

  return NextResponse.json({ dashboard }, { status: 201 });
}
