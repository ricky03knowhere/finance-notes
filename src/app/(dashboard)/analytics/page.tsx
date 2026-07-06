import { requireUser } from '@/lib/auth';
import { analyticsService } from '@/features/analytics/analytics.service';
import { AnalyticsManager } from '@/app/(dashboard)/analytics/_components/analytics-manager';

export default async function AnalyticsPage() {
  const user = await requireUser();
  const dashboard = await analyticsService.getDashboard(user.id);

  return <AnalyticsManager initialDashboard={dashboard} />;
}
