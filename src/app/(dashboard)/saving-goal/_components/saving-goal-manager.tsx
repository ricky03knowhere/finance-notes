'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import type { SavingGoalDashboard, SavingGoalRecord } from '@/features/saving-goal/saving-goal.types';
import { SavingGoalFormDialog, type SavingGoalFormValues } from '@/app/(dashboard)/saving-goal/_components/saving-goal-form-dialog';

type SavingGoalManagerProps = {
  initialDashboard: SavingGoalDashboard;
};

export function SavingGoalManager({ initialDashboard }: SavingGoalManagerProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingGoalRecord | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<SavingGoalRecord | null>(null);

  async function refreshDashboard() {
    const response = await fetch('/api/saving-goals', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Gagal memuat saving goal');
    }
    const payload = (await response.json()) as { dashboard: SavingGoalDashboard };
    setDashboard(payload.dashboard);
  }

  async function handleCreate(values: SavingGoalFormValues) {
    const response = await fetch('/api/saving-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      throw new Error('Gagal membuat saving goal');
    }
    await refreshDashboard();
  }

  async function handleUpdate(goalId: string, values: SavingGoalFormValues) {
    const response = await fetch(`/api/saving-goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      throw new Error('Gagal memperbarui saving goal');
    }
    await refreshDashboard();
  }

  async function handleDelete(goalId: string) {
    const response = await fetch(`/api/saving-goals/${goalId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Gagal menghapus saving goal');
    }
    await refreshDashboard();
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Saving Goal
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Capai target tabungan dengan mudah.</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Tetapkan target tabungan, pantau progres, dan tandai goal yang sudah tercapai.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Goal Baru
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Total Goal</CardDescription>
              <CardTitle>{dashboard.summary.totalGoals}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Total Target</CardDescription>
              <CardTitle>{formatCurrency(dashboard.summary.totalTarget)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Total Tersimpan</CardDescription>
              <CardTitle>{formatCurrency(dashboard.summary.totalSaved)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Rata-rata Progres</CardDescription>
              <CardTitle>{Math.round(dashboard.summary.averageProgress * 100)}%</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Saving Goals</CardTitle>
          <CardDescription>Daftar tujuan tabungan dan progresnya.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.savingGoals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Belum ada goal tabungan</p>
              <p className="mt-2 text-sm text-muted-foreground">Tetapkan target tabungan pertama Anda sekarang.</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)} variant="secondary">
                <Plus className="h-4 w-4" />
                Buat Goal
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.savingGoals.map((goal) => (
                <motion.article key={goal.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full border-border/70 bg-background/70">
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground">{goal.title}</p>
                          <p className="text-sm text-muted-foreground">Deadline: {new Date(goal.deadline).toLocaleDateString('id-ID')}</p>
                        </div>
                        <Badge variant={goal.completed ? 'success' : 'outline'}>{goal.completed ? 'Selesai' : 'Berjalan'}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Target</span>
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Tersimpan</span>
                          <span>{formatCurrency(goal.currentAmount)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(goal.progress * 100)}%` }} />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditGoal(goal)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteGoal(goal)}>
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

      <SavingGoalFormDialog
        mode="create"
        open={createOpen}
        goal={null}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          await toast.promise(handleCreate(values), {
            loading: 'Menyimpan goal...',
            success: 'Saving goal berhasil dibuat',
            error: (error) => (error instanceof Error ? error.message : 'Gagal membuat saving goal'),
          });
          setCreateOpen(false);
        }}
      />
      <SavingGoalFormDialog
        mode="edit"
        open={Boolean(editGoal)}
        goal={editGoal}
        onOpenChange={(open) => {
          if (!open) {
            setEditGoal(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editGoal) {
            return;
          }
          await toast.promise(handleUpdate(editGoal.id, values), {
            loading: 'Memperbarui goal...',
            success: 'Saving goal berhasil diperbarui',
            error: (error) => (error instanceof Error ? error.message : 'Gagal memperbarui saving goal'),
          });
          setEditGoal(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteGoal)}
        title="Hapus Saving Goal"
        description={`Hapus goal tabungan ${deleteGoal?.title ?? ''}? Progress akan dihapus.`}
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteGoal(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteGoal) {
            return;
          }
          await toast.promise(handleDelete(deleteGoal.id), {
            loading: 'Menghapus goal...',
            success: 'Saving goal berhasil dihapus',
            error: (error) => (error instanceof Error ? error.message : 'Gagal menghapus saving goal'),
          });
          setDeleteGoal(null);
        }}
      />
    </div>
  );
}
