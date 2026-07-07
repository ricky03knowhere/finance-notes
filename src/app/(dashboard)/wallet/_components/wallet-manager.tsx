'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Banknote, Plus, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { fetcher } from '@/lib/swr';
import type { WalletDashboard, WalletRecord } from '@/features/wallet/wallet.types';
import {
  WalletFormDialog,
  type WalletFormValues,
} from '@/app/(dashboard)/wallet/_components/wallet-form-dialog';
import {
  WalletTransferDialog,
  type WalletTransferValues,
} from '@/app/(dashboard)/wallet/_components/wallet-transfer-dialog';

const walletTypeLabel: Record<WalletRecord['type'], string> = {
  CASH: 'Cash',
  BANK: 'Bank',
  E_WALLET: 'E-Wallet',
  CREDIT_CARD: 'Credit Card',
};

type WalletManagerProps = {
  initialDashboard: WalletDashboard;
};

export function WalletManager({ initialDashboard }: WalletManagerProps) {
  const { data, mutate } = useSWR<{ dashboard: WalletDashboard }>('/api/wallets', fetcher, {
    fallbackData: { dashboard: initialDashboard },
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const dashboard = data?.dashboard ?? initialDashboard;
  const [createOpen, setCreateOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<WalletRecord | null>(null);
  const [transferWallet, setTransferWallet] = useState<WalletRecord | null>(null);
  const [deleteWallet, setDeleteWallet] = useState<WalletRecord | null>(null);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Balance', value: dashboard.summary.totalBalance, icon: Banknote },
      { label: 'Cash', value: dashboard.summary.cashBalance, icon: WalletIcon },
      { label: 'Bank', value: dashboard.summary.bankBalance, icon: WalletIcon },
      { label: 'E-Wallet', value: dashboard.summary.eWalletBalance, icon: WalletIcon },
    ],
    [dashboard.summary],
  );

  async function handleCreate(values: WalletFormValues) {
    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Gagal membuat wallet');
    }

    await mutate();
  }

  async function handleUpdate(walletId: string, values: WalletFormValues) {
    const response = await fetch(`/api/wallets/${walletId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Gagal memperbarui wallet');
    }

    await mutate();
  }

  async function handleDelete(walletId: string) {
    const response = await fetch(`/api/wallets/${walletId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Gagal menghapus wallet');
    }

    await mutate();
  }

  async function handleTransfer(values: WalletTransferValues) {
    const response = await fetch(`/api/wallets/${values.sourceWalletId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationWalletId: values.destinationWalletId,
        amount: values.amount,
        note: values.note,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Gagal melakukan transfer');
    }

    await mutate();
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Wallet
            </Badge>
            <div className="flex items-center gap-3">
              <WalletIcon className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Wallet</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Wallet Baru
            </Button>
            <Button variant="outline" onClick={() => setTransferWallet(dashboard.wallets[0] ?? null)} disabled={dashboard.wallets.length < 2}>
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card className="h-full">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardDescription>{item.label}</CardDescription>
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{formatCurrency(item.value)}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Wallet List</CardTitle>
            <CardDescription>Semua wallet aktif beserta saldo saat ini dan saldo awal.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.wallets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Belum ada wallet</p>
                <p className="mt-2 text-sm text-muted-foreground">Buat wallet pertama untuk mulai memisahkan dana.</p>
                <Button className="mt-4" onClick={() => setCreateOpen(true)} variant="secondary">
                  <Plus className="h-4 w-4" />
                  Buat Wallet
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {dashboard.wallets.map((wallet) => (
                  <motion.article key={wallet.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Card className="h-full border-border/70 bg-background/70">
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-semibold text-white shadow-soft" style={{ backgroundColor: wallet.color }}>
                              {wallet.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{wallet.name}</p>
                              <p className="text-sm text-muted-foreground">{walletTypeLabel[wallet.type]}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{wallet.type}</Badge>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current Balance</p>
                          <p className="text-2xl font-semibold">{formatCurrency(wallet.balance)}</p>
                          <p className="text-sm text-muted-foreground">Initial: {formatCurrency(wallet.initialBalance)}</p>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditWallet(wallet)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setTransferWallet(wallet)} disabled={dashboard.wallets.length < 2}>
                            <ArrowRightLeft className="h-4 w-4" />
                            Transfer
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteWallet(wallet)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Riwayat transaksi wallet terbaru.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentTransactions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">Belum ada aktivitas transaksi.</div>
            ) : (
              <div className="space-y-4">
                {dashboard.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl text-base font-semibold text-white" style={{ backgroundColor: transaction.walletColor }}>
                        {transaction.walletName.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.walletName}</p>
                        <p className="text-sm text-muted-foreground">{transaction.note || transaction.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.transactionDate).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <WalletFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          await toast.promise(handleCreate(values), {
            loading: 'Menyimpan wallet...',
            success: 'Wallet berhasil dibuat',
            error: (error) => (error instanceof Error ? error.message : 'Gagal membuat wallet'),
          });
          setCreateOpen(false);
        }}
      />

      <WalletFormDialog
        mode="edit"
        open={Boolean(editWallet)}
        wallet={editWallet}
        onOpenChange={(open) => {
          if (!open) {
            setEditWallet(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editWallet) {
            return;
          }

          await toast.promise(handleUpdate(editWallet.id, values), {
            loading: 'Memperbarui wallet...',
            success: 'Wallet berhasil diperbarui',
            error: (error) => (error instanceof Error ? error.message : 'Gagal memperbarui wallet'),
          });
          setEditWallet(null);
        }}
      />

      <WalletTransferDialog
        open={Boolean(transferWallet)}
        sourceWallet={transferWallet}
        wallets={dashboard.wallets}
        onOpenChange={(open) => {
          if (!open) {
            setTransferWallet(null);
          }
        }}
        onSubmit={async (values) => {
          await toast.promise(handleTransfer(values), {
            loading: 'Memproses transfer...',
            success: 'Transfer berhasil dilakukan',
            error: (error) => (error instanceof Error ? error.message : 'Gagal transfer wallet'),
          });
          setTransferWallet(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteWallet)}
        title="Hapus Wallet"
        description={`Hapus wallet ${deleteWallet?.name ?? ''}? Semua data transaksi terkait tetap tersimpan.`}
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteWallet(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteWallet) {
            return;
          }

          await handleDelete(deleteWallet.id);
          setDeleteWallet(null);
        }}
      />
    </div>
  );
}