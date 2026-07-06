import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { categoryService } from '@/features/category/category.service';
import { categoryCreateSchema } from '@/features/category/category.schema';

export async function GET() {
  const user = await requireUser();
  const dashboard = await categoryService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const input = categoryCreateSchema.parse(body);

  await categoryService.createCategory(user.id, input);
  const dashboard = await categoryService.getDashboard(user.id);

  return NextResponse.json({ dashboard }, { status: 201 });
}