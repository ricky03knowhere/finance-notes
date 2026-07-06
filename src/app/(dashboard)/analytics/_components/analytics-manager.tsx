'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsDashboard } from '@/features/analytics/analytics.types';
import { formatCurrency } from '@/lib/utils';

type AnalyticsManagerProps = {
  initialDashboard: AnalyticsDashboard;
};

export function AnalyticsManager({ initialDashboard }: AnalyticsManagerProps) {
  const dashboard = initialDashboard;

  const summaryCards = useMemo(
    () => [
      { label: 'Top Expense', value: dashboard.summary.highestExpense, icon: TrendingDown },
      { label: 'Average Daily Spending', value: dashboard.summary.averageDailySpending, icon: ArrowUpRight },
      { label: 'Financial Health Score', value: dashboard.summary.financialHealthScore, icon: TrendingUp },
      { label: 'Top Expense Category', value: dashboard.summary.topExpenseCategory, icon: BarChart3 },
    ] as const,
    [dashboard.summary],
  );

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Analytics
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Analitik keuangan untuk keputusan cepat.</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Lihat tren pengeluaran, pertumbuhan tabungan, dan kategori terbesar secara visual.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
              <Card className="h-full">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardDescription>{item.label}</CardDescription>
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">
                    {item.label === 'Top Expense Category' ? dashboard.summary.topExpenseCategory : formatCurrency(item.value as number)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
            <CardDescription>Analisis tren pengeluaran bulan demi bulan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            {dashboard.monthlyTrend.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Tidak ada data tren</p>
                <p className="mt-2 text-sm text-muted-foreground">Buat transaksi untuk melihat analitik.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={dashboard.monthlyTrend} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#bfdbfe" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yearly Trend</CardTitle>
            <CardDescription>Performa expense tahunan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            {dashboard.yearlyTrend.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Tidak ada data tahunan</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={dashboard.yearlyTrend} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Growth</CardTitle>
            <CardDescription>Performa pengeluaran per bulan.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.expenseGrowth.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Tidak ada data pertumbuhan</p>
                <p className="mt-2 text-sm text-muted-foreground">Catat transaksi untuk melihat tren.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.expenseGrowth.map((point) => (
                  <div key={point.label} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-background p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{point.label}</p>
                      <p className="mt-1 text-base font-semibold">{formatCurrency(point.value)}</p>
                    </div>
                    <Badge variant={point.value > 0 ? 'danger' : 'success'}>{point.value >= 0 ? 'Naik' : 'Turun'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Growth</CardTitle>
            <CardDescription>Perkembangan saldo di wallet.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.savingsGrowth.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-base font-medium">Tidak ada data tabungan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.savingsGrowth.map((point) => (
                  <div key={point.label} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-background p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{point.label}</p>
                      <p className="mt-1 text-base font-semibold">{formatCurrency(point.value)}</p>
                    </div>
                    <Badge variant="success">Growth</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
