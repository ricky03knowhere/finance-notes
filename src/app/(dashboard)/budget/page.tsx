import { requireUser } from '@/lib/auth';
import { budgetService } from '@/features/budget/budget.service';
import { BudgetManager } from '@/app/(dashboard)/budget/_components/budget-manager';

export default async function BudgetPage() {
  const user = await requireUser();
  const dashboard = await budgetService.getDashboard(user.id);

  return <BudgetManager initialDashboard={dashboard} />;
}
