import { requireUser } from '@/lib/auth';
import { billService } from '@/features/bill/bill.service';
import { BillManager } from '@/app/(dashboard)/bills/_components/bill-manager';

export default async function BillsPage() {
  const user = await requireUser();
  const dashboard = await billService.getDashboard(user.id);

  return <BillManager initialDashboard={dashboard} />;
}
