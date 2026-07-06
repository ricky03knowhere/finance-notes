import 'server-only';

import { prisma } from '@/lib/prisma';
import type { CategoryCreateInput, CategoryUpdateInput } from '@/features/category/category.schema';
import type { CategoryRecord } from '@/features/category/category.types';

type CategoryRow = {
  id: string;
  name: string;
  type: CategoryRecord['type'];
  color: string;
  icon: string;
  _count: { transactions: number };
};

function mapCategory(category: CategoryRow): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    transactionCount: category._count.transactions,
  };
}

export interface CategoryRepository {
  listCategories(userId: string): Promise<CategoryRecord[]>;
  getCategoryById(userId: string, categoryId: string): Promise<CategoryRecord | null>;
  createCategory(userId: string, input: CategoryCreateInput): Promise<CategoryRecord>;
  updateCategory(userId: string, categoryId: string, input: CategoryUpdateInput): Promise<CategoryRecord>;
  deleteCategory(userId: string, categoryId: string): Promise<void>;
}

export class PrismaCategoryRepository implements CategoryRepository {
  async listCategories(userId: string) {
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return categories.map(mapCategory);
  }

  async getCategoryById(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return category ? mapCategory(category) : null;
  }

  async createCategory(userId: string, input: CategoryCreateInput) {
    const category = await prisma.category.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        color: input.color,
        icon: input.icon,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return mapCategory(category);
  }

  async updateCategory(userId: string, categoryId: string, input: CategoryUpdateInput) {
    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!existingCategory) {
      throw new Error('Kategori tidak ditemukan');
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: input.name,
        type: input.type,
        color: input.color,
        icon: input.icon,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return mapCategory(category);
  }

  async deleteCategory(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });

    if (!category) {
      throw new Error('Kategori tidak ditemukan');
    }

    await prisma.category.delete({ where: { id: categoryId } });
  }
}