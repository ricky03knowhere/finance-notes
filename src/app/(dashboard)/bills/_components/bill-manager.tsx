'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { fetcher } from '@/lib/swr';
import type { BillDashboard, BillRecord } from '@/features/bill/bill.types';
import { BillFormDialog, type BillFormValues } from '@/app/(dashboard)/bills/_components/bill-form-dialog';

type BillManagerProps = {
  initialDashboard: BillDashboard;
};

export function BillManager({ initialDashboard }: BillManagerProps) {
  const { data, mutate } = useSWR<{ dashboard: BillDashboard }>('/api/bills', fetcher, {
    fallbackData: { dashboard: initialDashboard },
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const dashboard = data?.dashboard ?? initialDashboard;
  const [createOpen, setCreateOpen] = useState(false);
  const [editBill, setEditBill] = useState<BillRecord | null>(null);
  const [deleteBill, setDeleteBill] = useState<BillRecord | null>(null);

  async function handleCreate(values: BillFormValues) {
    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      throw new Error('Gagal membuat tagihan');
    }
    await mutate();
  }

  async function handleUpdate(billId: string, values: BillFormValues) {
    const response = await fetch(`/api/bills/${billId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      throw new Error('Gagal memperbarui tagihan');
    }
    await mutate();
  }

  async function handleDelete(billId: string) {
    const response = await fetch(`/api/bills/${billId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Gagal menghapus tagihan');
    }
    await mutate();
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Bills
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Kelola tagihan rutin dan pembayaran.</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Lacak due date, status pembayaran, dan tagihan berulang dalam satu tempat.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Tagihan Baru
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Total Tagihan</CardDescription>
              <CardTitle>{dashboard.summary.totalBills}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Total Nominal</CardDescription>
              <CardTitle>{formatCurrency(dashboard.summary.totalAmount)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Sudah Dibayar</CardDescription>
              <CardTitle>{formatCurrency(dashboard.summary.totalPaid)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Belum Dibayar</CardDescription>
              <CardTitle>{formatCurrency(dashboard.summary.totalOutstanding)}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Bill List</CardTitle>
          <CardDescription>Semua tagihan yang tercatat.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.bills.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Belum ada tagihan</p>
              <p className="mt-2 text-sm text-muted-foreground">Tambahkan tagihan agar pengingat tetap otomatis.</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)} variant="secondary">
                <Plus className="h-4 w-4" />
                Tambah Tagihan
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.bills.map((bill) => (
                <motion.article key={bill.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full border-border/70 bg-background/70">
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground">{bill.title}</p>
                          <p className="text-sm text-muted-foreground">Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID')}</p>
                        </div>
                        <Badge variant={bill.paid ? 'success' : 'danger'}>{bill.paid ? 'Paid' : bill.recurring ? 'Recurring' : 'Unpaid'}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Jumlah</span>
                          <span>{formatCurrency(bill.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Status</span>
                          <span>{bill.recurring ? 'Berulang' : 'Satu kali'}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditBill(bill)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteBill(bill)}>
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

      <BillFormDialog
        mode="create"
        open={createOpen}
        bill={null}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          await toast.promise(handleCreate(values), {
            loading: 'Menyimpan tagihan...',
            success: 'Tagihan berhasil dibuat',
            error: (error) => (error instanceof Error ? error.message : 'Gagal membuat tagihan'),
          });
          setCreateOpen(false);
        }}
      />
      <BillFormDialog
        mode="edit"
        open={Boolean(editBill)}
        bill={editBill}
        onOpenChange={(open) => {
          if (!open) {
            setEditBill(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editBill) {
            return;
          }
          await toast.promise(handleUpdate(editBill.id, values), {
            loading: 'Memperbarui tagihan...',
            success: 'Tagihan berhasil diperbarui',
            error: (error) => (error instanceof Error ? error.message : 'Gagal memperbarui tagihan'),
          });
          setEditBill(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteBill)}
        title="Hapus Tagihan"
        description={`Hapus tagihan ${deleteBill?.title ?? ''}? Status pembayaran akan hilang.`}
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBill(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteBill) {
            return;
          }
          await toast.promise(handleDelete(deleteBill.id), {
            loading: 'Menghapus tagihan...',
            success: 'Tagihan berhasil dihapus',
            error: (error) => (error instanceof Error ? error.message : 'Gagal menghapus tagihan'),
          });
          setDeleteBill(null);
        }}
      />
    </div>
  );
}
