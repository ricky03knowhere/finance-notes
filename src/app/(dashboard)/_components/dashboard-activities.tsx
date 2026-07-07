'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Dashboard } from '@/features/dashboard/dashboard.types';
import { formatCurrency } from '@/lib/utils';

export default function DashboardActivities({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Transaksi terbaru Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.recentTransactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Belum ada transaksi</p>
            </div>
          ) : (
            dashboard.recentTransactions.map((tx) => (
              <div key={tx.id} className="rounded-3xl border border-border bg-background p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{tx.type}</p>
                  <p className="mt-1 text-base font-semibold">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold">{formatCurrency(tx.amount)}</p>
                  <p className="text-xs text-muted-foreground">{tx.categoryName ?? '-'}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Performa anggaran per kategori.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {dashboard.budgetProgress.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Tidak ada budget aktif</p>
            </div>
          ) : (
            dashboard.budgetProgress.map((b) => (
              <div key={b.categoryName} className="rounded-3xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{b.categoryName}</p>
                    <p className="mt-1 text-base font-semibold">{formatCurrency(b.budgetAmount)}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{Math.round(b.progress * 100)}%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(b.progress * 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
