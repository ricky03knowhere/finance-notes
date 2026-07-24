"use client";

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { ChartPie, ChevronRight, LucideGaugeCircle, RefreshCcw, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dashboard } from '@/features/dashboard/dashboard.types';
import { formatCurrency } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboard.store';
import { fetcher } from '@/lib/swr';

const IncomeExpenseChart = dynamic(() => import('@/components/charts/income-expense-chart'), {
  ssr: false,
  loading: () => (
    <div className="rounded-3xl border border-dashed border-border p-8 text-center">
      <p className="text-base font-medium">Memuat grafik…</p>
    </div>
  ),
});

const DashboardDetails = dynamic(() => import('@/app/(dashboard)/_components/dashboard-details'), {
  ssr: false,
  loading: () => (
    <div className="rounded-3xl border border-dashed border-border p-8 text-center">
      <p className="text-base font-medium">Memuat detail…</p>
    </div>
  ),
});

export function DashboardManager({ initialDashboard }: { initialDashboard: Dashboard }) {
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const cached = useDashboardStore((s) => s.dashboard);

  const { data, mutate, isLoading } = useSWR<{ dashboard: Dashboard }>('/api/dashboard', fetcher, {
    fallbackData: { dashboard: initialDashboard },
  });

  const dashboard = data?.dashboard ?? initialDashboard;
  const hydratedDashboard = cached ?? dashboard;

  useEffect(() => {
    if (hydratedDashboard) setDashboard(hydratedDashboard);
  }, [hydratedDashboard, setDashboard]);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Balance', value: dashboard.summary.totalBalance, icon: Sparkles },
      { label: 'Total Income', value: dashboard.summary.totalIncome, icon: ChartPie },
      { label: 'Total Expense', value: dashboard.summary.totalExpense, icon: ChartPie },
      { label: 'Savings', value: dashboard.summary.savings, icon: ChartPie },
    ],
    [dashboard.summary],
  );

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard
            </Badge>
            <div className="flex items-center gap-3">
              <LucideGaugeCircle className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => mutate()} disabled={isLoading}>
              <RefreshCcw className="h-4 w-4" />
              {isLoading ? 'Menyegarkan...' : 'Refresh'}
            </Button>
            <Button variant="secondary">
              <ChevronRight className="h-4 w-4" />
              Quick Action
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="h-full">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardDescription>{item.label}</CardDescription>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle>{formatCurrency(item.value)}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense</CardTitle>
            <CardDescription>Perbandingan pemasukan dan pengeluaran bulanan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {hydratedDashboard.incomeExpenseTrend.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Tidak ada data</p>
              </div>
            ) : (
              <IncomeExpenseChart data={hydratedDashboard.incomeExpenseTrend} />
            )}
          </CardContent>
        </Card>

        <DashboardDetails dashboard={hydratedDashboard} />
      </section>

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
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>Tagihan mendatang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.upcomingBills.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Tidak ada tagihan mendatang</p>
              </div>
            ) : (
              dashboard.upcomingBills.map((b) => (
                <div key={b.id} className="rounded-3xl border border-border bg-background p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.dueDate).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">{formatCurrency(b.amount)}</p>
                    <Badge variant={b.paid ? 'success' : 'danger'}>{b.paid ? 'Paid' : 'Due'}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
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
                    <Badge variant={b.progress >= 1 ? 'danger' : 'success'}>{Math.round(b.progress * 100)}%</Badge>
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
    </div>
  );
}
