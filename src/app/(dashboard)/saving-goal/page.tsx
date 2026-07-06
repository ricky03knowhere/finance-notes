import { requireUser } from '@/lib/auth';
import { savingGoalService } from '@/features/saving-goal/saving-goal.service';
import { SavingGoalManager } from '@/app/(dashboard)/saving-goal/_components/saving-goal-manager';

export default async function SavingGoalPage() {
  const user = await requireUser();
  const dashboard = await savingGoalService.getDashboard(user.id);

  return <SavingGoalManager initialDashboard={dashboard} />;
}
