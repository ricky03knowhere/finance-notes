'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ChartPie, FileText, Layers, Sparkles } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportDashboard } from '@/features/report/report.types';
import { formatCurrency } from '@/lib/utils';

type ReportManagerProps = {
  initialDashboard: ReportDashboard;
};

export function ReportManager({ initialDashboard }: ReportManagerProps) {
  const dashboard = initialDashboard;

  const summaryCards = useMemo(
    () => [
      { label: 'Total Income', value: dashboard.summary.totalIncome, icon: Sparkles },
      { label: 'Total Expense', value: dashboard.summary.totalExpense, icon: BarChart3 },
      { label: 'Net Cash Flow', value: dashboard.summary.netCashFlow, icon: Layers },
      { label: 'Net Worth', value: dashboard.summary.netWorth, icon: ChartPie },
    ],
    [dashboard.summary],
  );

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Reports
            </Badge>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Reports</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <Sparkles className="h-4 w-4" />
              Export PDF
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

      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>Pengeluaran terbesar berdasarkan kategori.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.topCategories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Tidak ada data kategori</p>
              <p className="mt-2 text-sm text-muted-foreground">Lakukan transaksi mulai hari ini untuk melihat laporan.</p>
            </div>
          ) : (
            dashboard.topCategories.map((item) => (
              <div key={item.categoryName} className="rounded-3xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Kategori</p>
                    <p className="mt-1 text-base font-semibold">{item.categoryName}</p>
                  </div>
                  <Badge variant="outline">{formatCurrency(item.amount)}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Lihat pendapatan, pengeluaran, dan cash flow setiap bulan.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          {dashboard.monthlyTrend.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Tidak ada data tren bulanan</p>
              <p className="mt-2 text-sm text-muted-foreground">Transaksi akan menghasilkan laporan tren di sini.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dashboard.monthlyTrend} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="netCashFlow" stroke="#2563eb" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Usage</CardTitle>
          <CardDescription>Bagaimana pencapaian budget untuk kategori teratas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {dashboard.budgetUsage.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Tidak ada budget aktif</p>
              <p className="mt-2 text-sm text-muted-foreground">Tambahkan budget untuk melihat penggunaan real time.</p>
            </div>
          ) : (
            dashboard.budgetUsage.map((item) => (
              <div key={item.categoryName} className="rounded-3xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.categoryName}</p>
                    <p className="mt-1 text-base font-semibold">{formatCurrency(item.budgetAmount)}</p>
                  </div>
                  <Badge variant={item.progress >= 1 ? 'danger' : 'success'}>{Math.round(item.progress * 100)}%</Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
