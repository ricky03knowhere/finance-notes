import 'server-only';

import { PrismaCategoryRepository } from '@/features/category/category.repository';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from '@/features/category/category.schema';
import type { CategoryDashboard, CategorySummary } from '@/features/category/category.types';

const categoryRepository = new PrismaCategoryRepository();

function createSummary(categories: CategoryDashboard['categories']): CategorySummary {
  return categories.reduce<CategorySummary>(
    (summary, category) => ({
      totalCategories: summary.totalCategories + 1,
      incomeCategories: summary.incomeCategories + (category.type === 'INCOME' ? 1 : 0),
      expenseCategories: summary.expenseCategories + (category.type === 'EXPENSE' ? 1 : 0),
    }),
    {
      totalCategories: 0,
      incomeCategories: 0,
      expenseCategories: 0,
    },
  );
}

export class CategoryService {
  async getDashboard(userId: string): Promise<CategoryDashboard> {
    const categories = await categoryRepository.listCategories(userId);

    return {
      summary: createSummary(categories),
      categories,
    };
  }

  async createCategory(userId: string, input: CategoryCreateInput) {
    const parsed = categoryCreateSchema.parse(input);
    return categoryRepository.createCategory(userId, parsed);
  }

  async updateCategory(userId: string, categoryId: string, input: CategoryUpdateInput) {
    const parsed = categoryUpdateSchema.parse(input);
    return categoryRepository.updateCategory(userId, categoryId, parsed);
  }

  async deleteCategory(userId: string, categoryId: string) {
    return categoryRepository.deleteCategory(userId, categoryId);
  }
}

export const categoryService = new CategoryService();