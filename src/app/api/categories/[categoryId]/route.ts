import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { categoryService } from '@/features/category/category.service';
import { categoryUpdateSchema } from '@/features/category/category.schema';

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  const { categoryId } = await context.params;
  const body = await request.json();
  const input = categoryUpdateSchema.parse(body);

  await categoryService.updateCategory(user.id, categoryId, input);
  const dashboard = await categoryService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { categoryId } = await context.params;

  await categoryService.deleteCategory(user.id, categoryId);
  const dashboard = await categoryService.getDashboard(user.id);

  return NextResponse.json({ dashboard });
}