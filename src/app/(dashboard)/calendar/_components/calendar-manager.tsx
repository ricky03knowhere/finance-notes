'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { YearlyRecap } from '@/features/calendar/calendar.types';
import { cn, formatCurrency } from '@/lib/utils';

type CalendarManagerProps = {
  initialRecap: YearlyRecap;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

export function CalendarManager({ initialRecap }: CalendarManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isYearOpen, setIsYearOpen] = useState(false);

  const recap = initialRecap;

  const handleYearChange = useCallback(
    (year: number) => {
      setIsYearOpen(false);
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('year', String(year));
        router.push(`/calendar?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const totalYearIncome = recap.months.reduce((sum, m) => sum + m.income, 0);
  const totalYearSpend = recap.months.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalYearLeft = totalYearIncome - totalYearSpend;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Page header */}
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Calendar
            </Badge>
            <div className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Rekap Pengeluaran</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Rekap income dan pengeluaran tahunan dalam format tabel per bulan.
            </p>
          </div>

          {/* Year selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYearOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-soft transition-all hover:bg-muted/50',
                isPending && 'pointer-events-none opacity-60',
              )}
            >
              <Calendar className="h-4 w-4 text-primary" />
              <span>{recap.year}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isYearOpen && 'rotate-180')} />
            </button>

            {isYearOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full z-50 mt-2 max-h-60 w-36 overflow-auto rounded-2xl border border-border bg-card p-1.5 shadow-lg"
              >
                {recap.availableYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearChange(year)}
                    className={cn(
                      'w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/50',
                      year === recap.year && 'bg-primary/10 text-primary',
                    )}
                  >
                    {year}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <CardTitle className="text-2xl">{formatCurrency(totalYearIncome)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
          <Card className="h-full">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                <div className="rounded-2xl bg-red-500/10 p-2 text-red-600 dark:text-red-400">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <CardTitle className="text-2xl">{formatCurrency(totalYearSpend)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Sisa Tahun Ini</p>
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <CardTitle className={cn('text-2xl', totalYearLeft >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                {formatCurrency(totalYearLeft)}
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
      </section>

      {/* Monthly recap grid */}
      {recap.months.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-base font-medium">Belum ada transaksi di tahun {recap.year}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tambahkan transaksi untuk melihat rekap pengeluaran tahunan.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {recap.months.map((month) => (
            <MonthCard key={month.month} month={month} />
          ))}
        </motion.section>
      )}
    </div>
  );
}

/* ─── Month Card Component ─── */

function MonthCard({ month }: { month: YearlyRecap['months'][number] }) {
  return (
    <motion.div variants={cardVariants} className="flex flex-col">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {/* Month header */}
        <div className="flex items-center justify-between bg-[#2d5a3d] px-4 py-2.5 dark:bg-[#1a3a27]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{month.monthLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/60" />
          </div>
          <Calendar className="h-4 w-4 text-white/70" />
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-3 border-b border-border bg-[#3a7a52]/90 px-1 dark:bg-[#265a3a]/90">
          <div className="flex items-center gap-1 px-3 py-1.5">
            <span className="text-xs font-semibold text-white">Income</span>
            <ChevronDown className="h-3 w-3 text-white/50" />
          </div>
          <div className="flex items-center gap-1 border-x border-white/10 px-3 py-1.5">
            <span className="text-xs font-semibold text-white">Spend</span>
            <ChevronDown className="h-3 w-3 text-white/50" />
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5">
            <span className="text-xs font-semibold text-white">Notes</span>
            <ChevronDown className="h-3 w-3 text-white/50" />
          </div>
        </div>

        {/* Table body */}
        <div className="divide-y divide-border">
          {/* Income row */}
          <div className="grid grid-cols-3 px-1">
            <div className="px-3 py-2.5">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(month.income)}</span>
            </div>
            <div className="border-x border-border px-3 py-2.5" />
            <div className="px-3 py-2.5" />
          </div>

          {/* Expense rows */}
          {month.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 px-1">
              <div className="px-3 py-2.5" />
              <div className="border-x border-border px-3 py-2.5">
                <span className="text-sm text-foreground">{formatCurrency(item.amount)}</span>
              </div>
              <div className="px-3 py-2.5">
                <span className="text-sm text-muted-foreground">{item.note || '—'}</span>
              </div>
            </div>
          ))}

          {/* Footer: Left */}
          <div className="grid grid-cols-3 bg-muted/30 px-1">
            <div className="px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Left</span>
            </div>
            <div className="border-x border-border px-3 py-2.5" />
            <div className="px-3 py-2.5" />
          </div>
          <div className="grid grid-cols-3 bg-muted/30 px-1">
            <div className="px-3 py-2.5">
              <span className={cn(
                'text-sm font-semibold',
                month.left >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
              )}>
                {formatCurrency(month.left)}
              </span>
            </div>
            <div className="border-x border-border px-3 py-2.5">
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(month.totalSpend)}</span>
            </div>
            <div className="px-3 py-2.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
