import { requireUser } from '@/lib/auth';
import { reportService } from '@/features/report/report.service';
import { ReportManager } from '@/app/(dashboard)/reports/_components/report-manager';

export default async function ReportsPage() {
  const user = await requireUser();
  const dashboard = await reportService.getDashboard(user.id);

  return <ReportManager initialDashboard={dashboard} />;
}
