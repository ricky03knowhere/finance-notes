import { requireUser } from '@/lib/auth';
import { walletService } from '@/features/wallet/wallet.service';
import { WalletManager } from '@/app/(dashboard)/wallet/_components/wallet-manager';

export default async function WalletPage() {
  const user = await requireUser();
  const dashboard = await walletService.getDashboard(user.id);

  return <WalletManager initialDashboard={dashboard} />;
}