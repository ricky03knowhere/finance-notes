'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { fetcher } from '@/lib/swr';
import type { BudgetDashboard, BudgetRecord } from '@/features/budget/budget.types';
import { BudgetFormDialog, type BudgetFormValues } from '@/app/(dashboard)/budget/_components/budget-form-dialog';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

type BudgetManagerProps = {
  initialDashboard: BudgetDashboard;
};

export function BudgetManager({ initialDashboard }: BudgetManagerProps) {
  const { data, mutate } = useSWR<{ dashboard: BudgetDashboard }>('/api/budgets', fetcher, {
    fallbackData: { dashboard: initialDashboard },
  });
  const dashboard = data?.dashboard ?? initialDashboard;
  const [createOpen, setCreateOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetRecord | null>(null);
  const [deleteBudget, setDeleteBudget] = useState<BudgetRecord | null>(null);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Budget', value: dashboard.summary.totalBudgets, icon: CalendarDays },
      { label: 'Budget Total', value: dashboard.summary.totalBudgetAmount, icon: CalendarDays },
      { label: 'Spent', value: dashboard.summary.totalSpentAmount, icon: CalendarDays },
      { label: 'Remaining', value: dashboard.summary.totalRemainingAmount, icon: CalendarDays },
    ],
    [dashboard.summary],
  );

  async function handleCreate(values: BudgetFormValues) {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Gagal membuat budget');
    }

    await mutate();
  }

  async function handleUpdate(budgetId: string, values: BudgetFormValues) {
    const response = await fetch(`/api/budgets/${budgetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Gagal memperbarui budget');
    }

    await mutate();
  }

  async function handleDelete(budgetId: string) {
    const response = await fetch(`/api/budgets/${budgetId}`, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error('Gagal menghapus budget');
    }

    await mutate();
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Budget
            </Badge>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Budget</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Budget Baru
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
          <CardTitle>Budget List</CardTitle>
          <CardDescription>Semua anggaran yang telah ditetapkan per kategori.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.budgets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Belum ada budget</p>
              <p className="mt-2 text-sm text-muted-foreground">Tambahkan budget pertama untuk memulai perencanaan keuangan.</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)} variant="secondary">
                <Plus className="h-4 w-4" />
                Buat Budget
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.budgets.map((budget) => (
                <motion.article key={budget.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full border-border/70 bg-background/70">
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-semibold text-white shadow-soft" style={{ backgroundColor: budget.categoryColor }}>
                            {budget.categoryIcon}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{budget.categoryName}</p>
                            <p className="text-sm text-muted-foreground">{budget.categoryType} • {monthNames[budget.month - 1]} {budget.year}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{budget.categoryType}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Budget</span>
                          <span>{formatCurrency(budget.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Terpakai</span>
                          <span>{formatCurrency(budget.spentAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Sisa</span>
                          <span>{formatCurrency(budget.remainingAmount)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(budget.progress * 100)}%` }} />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditBudget(budget)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteBudget(budget)}>
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

      <BudgetFormDialog
        categories={dashboard.categories}
        mode="create"
        open={createOpen}
        budget={null}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          await toast.promise(handleCreate(values), {
            loading: 'Menyimpan budget...',
            success: 'Budget berhasil dibuat',
            error: (error) => (error instanceof Error ? error.message : 'Gagal membuat budget'),
          });
          setCreateOpen(false);
        }}
      />

      <BudgetFormDialog
        categories={dashboard.categories}
        mode="edit"
        open={Boolean(editBudget)}
        budget={editBudget}
        onOpenChange={(open) => {
          if (!open) {
            setEditBudget(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editBudget) {
            return;
          }

          await toast.promise(handleUpdate(editBudget.id, values), {
            loading: 'Memperbarui budget...',
            success: 'Budget berhasil diperbarui',
            error: (error) => (error instanceof Error ? error.message : 'Gagal memperbarui budget'),
          });
          setEditBudget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteBudget)}
        title="Hapus Budget"
        description={`Hapus budget untuk kategori ${deleteBudget?.categoryName ?? ''} pada ${monthNames[deleteBudget?.month ?? 1 - 1]} ${deleteBudget?.year ?? ''}?`}
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBudget(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteBudget) {
            return;
          }

          await toast.promise(handleDelete(deleteBudget.id), {
            loading: 'Menghapus budget...',
            success: 'Budget berhasil dihapus',
            error: (error) => (error instanceof Error ? error.message : 'Gagal menghapus budget'),
          });
          setDeleteBudget(null);
        }}
      />
    </div>
  );
}
