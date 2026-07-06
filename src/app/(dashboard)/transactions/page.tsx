import { requireUser } from '@/lib/auth';
import { transactionService } from '@/features/transaction/transaction.service';
import { TransactionManager } from '@/app/(dashboard)/transactions/_components/transaction-manager';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const dashboard = await transactionService.getDashboard(user.id, (await searchParams) ?? undefined);

  return <TransactionManager initialDashboard={dashboard} />;
}