import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { billService } from '@/features/bill/bill.service';
import { billUpdateSchema } from '@/features/bill/bill.schema';

type RouteContext = {
  params: Promise<{ billId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { billId } = await context.params;
  const body = await request.json();
  const input = billUpdateSchema.parse(body);

  await billService.updateBill(user.id, billId, input);
  const dashboard = await billService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { billId } = await context.params;

  await billService.deleteBill(user.id, billId);
  const dashboard = await billService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}
