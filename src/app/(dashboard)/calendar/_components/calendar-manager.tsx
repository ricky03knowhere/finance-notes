'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock3, Plus, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CalendarDashboard, CalendarEvent } from '@/features/calendar/calendar.types';
import { formatCurrency } from '@/lib/utils';

const eventLabel: Record<CalendarEvent['type'], string> = {
  transaction: 'Transaksi',
  bill: 'Tagihan',
};

const statusBadge: Record<CalendarEvent['status'], 'success' | 'danger' | 'warning'> = {
  completed: 'success',
  due: 'danger',
  upcoming: 'warning',
};

type CalendarManagerProps = {
  initialDashboard: CalendarDashboard;
};

export function CalendarManager({ initialDashboard }: CalendarManagerProps) {
  const [dashboard] = useState(initialDashboard);

  const summaryCards = useMemo(
    () => [
      { label: 'Upcoming Bills', value: dashboard.summary.upcomingBills, icon: Clock3 },
      { label: 'Bill Amount', value: dashboard.summary.upcomingBillAmount, icon: Sparkles },
      { label: 'Active Days', value: dashboard.summary.activeDays, icon: CalendarDays },
      { label: 'Month Events', value: dashboard.summary.currentMonthEvents, icon: CalendarDays },
    ],
    [dashboard.summary],
  );

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Calendar
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Jadwal transaksi dan tagihan Anda.</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Lihat aktivitas keuangan harian dan tagihan mendatang dalam tampilan kalender ringkas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <Plus className="h-4 w-4" />
              Tambah Event
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
                  <CardTitle className="text-2xl">{typeof item.value === 'number' ? formatCurrency(item.value) : item.value}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Events</CardTitle>
          <CardDescription>Event transaksi dan tagihan untuk bulan ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Tidak ada event kalender</p>
              <p className="mt-2 text-sm text-muted-foreground">Semua aktivitas akan muncul di sini saat ada transaksi dan tagihan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.events.map((event) => (
                <div key={event.id} className="rounded-3xl border border-border bg-background p-4 shadow-soft">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{eventLabel[event.type]}</p>
                      <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadge[event.status]}>{event.status === 'upcoming' ? 'Upcoming' : event.status === 'due' ? 'Due' : 'Completed'}</Badge>
                      <span className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Jumlah</p>
                      <p className="mt-1 text-sm font-semibold">{formatCurrency(event.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Kategori</p>
                      <p className="mt-1 text-sm font-semibold">{event.categoryName ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Wallet</p>
                      <p className="mt-1 text-sm font-semibold">{event.walletName ?? '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.weeklySummary.map((item) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="h-full">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardDescription>{item.label}</CardDescription>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <Clock3 className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl">
                  {item.label.includes('Income') || item.label.includes('Expense') ? formatCurrency(item.value) : item.value}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Transaction Overview</CardTitle>
          <CardDescription>Jumlah tipe transaksi selama bulan ini.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {dashboard.monthlyTransactions.map((item) => (
            <div key={item.label} className="rounded-3xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Ringkasan aktivitas berdasarkan hari.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.dailyActivity.map((item) => (
            <div key={item.date} className="rounded-3xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString('id-ID')}</p>
              <p className="mt-2 text-lg font-semibold">{item.count} event</p>
              <p className="text-sm text-muted-foreground">Income {formatCurrency(item.income)}</p>
              <p className="text-sm text-muted-foreground">Expense {formatCurrency(item.expense)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
