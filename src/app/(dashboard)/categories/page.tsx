import { requireUser } from '@/lib/auth';
import { categoryService } from '@/features/category/category.service';
import { CategoryManager } from '@/app/(dashboard)/categories/_components/category-manager';

export default async function CategoriesPage() {
  const user = await requireUser();
  const dashboard = await categoryService.getDashboard(user.id);

  return <CategoryManager initialDashboard={dashboard} />;
}