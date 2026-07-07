import { requireUser } from '@/lib/auth';
import { dashboardService } from '@/features/dashboard/dashboard.service';
import { DashboardManager } from '@/app/(dashboard)/_components/dashboard-manager';

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await dashboardService.getDashboard(user.id);

  return <DashboardManager initialDashboard={dashboard} />;
}
