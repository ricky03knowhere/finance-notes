import { requireUser } from '@/lib/auth';
import { dashboardService } from '@/features/dashboard/dashboard.service';
import { DashboardManager } from '@/app/(dashboard)/_components/dashboard-manager';

export const revalidate = 60; // cache dashboard server response for 60s

export default async function DashboardRoutePage() {
  const user = await requireUser();
  const dashboard = await dashboardService.getDashboard(user.id);

  return <DashboardManager initialDashboard={dashboard} />;
}
