'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, CopyPlus, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { fetcher } from '@/lib/swr';
import type { TransactionDashboard, TransactionRecord, TransactionType } from '@/features/transaction/transaction.types';
import { TransactionFormDialog, type TransactionFormValues } from '@/app/(dashboard)/transactions/_components/transaction-form-dialog';

const typeLabel: Record<TransactionType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER: 'Transfer',
};

const typeBadgeVariant: Record<TransactionType, 'success' | 'danger' | 'outline'> = {
  INCOME: 'success',
  EXPENSE: 'danger',
  TRANSFER: 'outline',
};

const sortOptions = [
  { label: 'Tanggal terbaru', value: 'transactionDate-desc' },
  { label: 'Tanggal terlama', value: 'transactionDate-asc' },
  { label: 'Nominal tertinggi', value: 'amount-desc' },
  { label: 'Nominal terendah', value: 'amount-asc' },
] as const;

type TransactionManagerProps = {
  initialDashboard: TransactionDashboard;
};

export function TransactionManager({ initialDashboard }: TransactionManagerProps) {
  const [filters, setFilters] = useState(initialDashboard.filters);
  const [searchInput, setSearchInput] = useState(initialDashboard.filters.search);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<TransactionRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTransaction, setDeleteTransaction] = useState<TransactionRecord | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const queryKey = `/api/transactions?${new URLSearchParams({
    search: filters.search,
    type: filters.type,
    walletId: filters.walletId,
    categoryId: filters.categoryId,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  }).toString()}`;

  const { data, mutate } = useSWR<{ dashboard: TransactionDashboard }>(queryKey, fetcher, {
    fallbackData: { dashboard: initialDashboard },
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const dashboard = data?.dashboard ?? initialDashboard;

  const summaryCards = useMemo(
    () => [
      { label: 'Total Transaction', value: dashboard.summary.totalTransactions, icon: Filter },
      { label: 'Income', value: dashboard.summary.incomeTotal, icon: ArrowUpRight },
      { label: 'Expense', value: dashboard.summary.expenseTotal, icon: ArrowDownLeft },
      { label: 'Net Cash Flow', value: dashboard.summary.netCashFlow, icon: ArrowRightLeft },
    ],
    [dashboard.summary],
  );

  function updateFilters(next: Partial<typeof filters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  async function loadDashboard() {
    await mutate();
    setSelectedIds([]);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      updateFilters({ search: searchInput, page: 1 });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadDashboard().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat transaksi');
    });
  }, [queryKey]);

  async function handleCreate(values: TransactionFormValues) {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Gagal membuat transaksi');
    }

    await mutate();
  }

  async function handleUpdate(transactionId: string, values: TransactionFormValues) {
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Gagal memperbarui transaksi');
    }

    await mutate();
  }

  async function handleDelete(transactionId: string) {
    const response = await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error('Gagal menghapus transaksi');
    }

    await mutate();
  }

  async function handleDuplicate(transactionId: string) {
    const response = await fetch(`/api/transactions/${transactionId}/duplicate`, { method: 'POST' });

    if (!response.ok) {
      throw new Error('Gagal menggandakan transaksi');
    }

    await mutate();
  }

  async function handleBulkDelete() {
    const response = await fetch('/api/transactions/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus transaksi');
    }

    await mutate();
  }

  const allVisibleSelected = dashboard.transactions.length > 0 && dashboard.transactions.every((transaction) => selectedIds.includes(transaction.id));

  function toggleAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !dashboard.transactions.some((transaction) => transaction.id === id));
      }

      return Array.from(new Set([...current, ...dashboard.transactions.map((transaction) => transaction.id)]));
    });
  }

  function toggleSelected(transactionId: string) {
    setSelectedIds((current) =>
      current.includes(transactionId) ? current.filter((id) => id !== transactionId) : [...current, transactionId],
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Transaction
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Catat semua transaksi dengan filter yang fleksibel.</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Kelola income, expense, transfer, tag, dan histori transaksi dari satu tempat.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Transaksi Baru
            </Button>
            <Button disabled={selectedIds.length === 0} variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Hapus Terpilih
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
          <CardTitle>Filter & Search</CardTitle>
          <CardDescription>Temukan transaksi dengan cepat menggunakan pencarian, filter, dan sorting.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Cari transaksi..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>

          <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" value={filters.type} onChange={(event) => updateFilters({ type: event.target.value as TransactionDashboard['filters']['type'], page: 1 })}>
            <option value="ALL">Semua tipe</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" value={filters.walletId} onChange={(event) => updateFilters({ walletId: event.target.value, page: 1 })}>
            <option value="">Semua wallet</option>
            {dashboard.wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.icon} {wallet.name}
              </option>
            ))}
          </select>

          <select className="h-11 rounded-2xl border border-border bg-background px-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring" value={`${filters.sortBy}-${filters.sortDirection}`} onChange={(event) => {
            const [sortBy, sortDirection] = event.target.value.split('-') as [TransactionDashboard['filters']['sortBy'], TransactionDashboard['filters']['sortDirection']];
            updateFilters({ sortBy, sortDirection, page: 1 });
          }}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction List</CardTitle>
          <CardDescription>Daftar transaksi yang tersimpan beserta catatan, tag, dan lokasi.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.transactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Belum ada transaksi</p>
              <p className="mt-2 text-sm text-muted-foreground">Buat transaksi pertama untuk mengisi histori keuangan kamu.</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)} variant="secondary">
                <Plus className="h-4 w-4" />
                Buat Transaksi
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input checked={allVisibleSelected} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" onChange={toggleAllVisible} type="checkbox" />
                      </TableHead>
                      <TableHead>Transaksi</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <input checked={selectedIds.includes(transaction.id)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" onChange={() => toggleSelected(transaction.id)} type="checkbox" />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{transaction.note || 'Tanpa catatan'}</p>
                            <div className="flex flex-wrap gap-2">
                              {transaction.tagNames.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: transaction.walletColor }} />
                            <span>{transaction.walletName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.categoryName || 'Transfer / Unassigned'}</TableCell>
                        <TableCell>
                          <Badge variant={typeBadgeVariant[transaction.type]}>{typeLabel[transaction.type]}</Badge>
                        </TableCell>
                        <TableCell className={transaction.type === 'EXPENSE' ? 'text-red-500' : transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-foreground'}>
                          {transaction.type === 'EXPENSE' ? '-' : transaction.type === 'INCOME' ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{new Date(transaction.transactionDate).toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditTransaction(transaction)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => void toast.promise(handleDuplicate(transaction.id), {
                              loading: 'Menduplikasi transaksi...',
                              success: 'Transaksi berhasil digandakan',
                              error: (error) => (error instanceof Error ? error.message : 'Gagal menggandakan transaksi'),
                            })}>
                              <CopyPlus className="h-4 w-4" />
                              Duplicate
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeleteTransaction(transaction)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 md:hidden">
                {dashboard.transactions.map((transaction) => (
                  <motion.article key={transaction.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Card className="border-border/70 bg-background/70">
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input checked={selectedIds.includes(transaction.id)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" onChange={() => toggleSelected(transaction.id)} type="checkbox" />
                            <div>
                              <p className="font-medium">{transaction.note || 'Tanpa catatan'}</p>
                              <p className="text-sm text-muted-foreground">{transaction.walletName}</p>
                            </div>
                          </div>
                          <Badge variant={typeBadgeVariant[transaction.type]}>{typeLabel[transaction.type]}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {transaction.tagNames.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <p>Kategori: {transaction.categoryName || 'Transfer / Unassigned'}</p>
                          <p>Tanggal: {new Date(transaction.transactionDate).toLocaleString('id-ID')}</p>
                          <p>Nominal: {formatCurrency(transaction.amount)}</p>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditTransaction(transaction)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void toast.promise(handleDuplicate(transaction.id), {
                            loading: 'Menduplikasi transaksi...',
                            success: 'Transaksi berhasil digandakan',
                            error: (error) => (error instanceof Error ? error.message : 'Gagal menggandakan transaksi'),
                          })}>
                            <CopyPlus className="h-4 w-4" />
                            Duplicate
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteTransaction(transaction)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="text-sm text-muted-foreground">
          Page {dashboard.pagination.page} of {dashboard.pagination.totalPages || 1}
        </div>
        <div className="flex gap-2">
          <Button disabled={dashboard.pagination.page <= 1} variant="outline" onClick={() => updateFilters({ page: Math.max(filters.page - 1, 1) })}>
            Previous
          </Button>
          <Button disabled={dashboard.pagination.page >= dashboard.pagination.totalPages} variant="outline" onClick={() => updateFilters({ page: filters.page + 1 })}>
            Next
          </Button>
        </div>
      </div>

      <TransactionFormDialog
        categories={dashboard.categories}
        mode="create"
        open={createOpen}
        transaction={null}
        wallets={dashboard.wallets}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          await toast.promise(handleCreate(values), {
            loading: 'Menyimpan transaksi...',
            success: 'Transaksi berhasil dibuat',
            error: (error) => (error instanceof Error ? error.message : 'Gagal membuat transaksi'),
          });
          setCreateOpen(false);
        }}
      />

      <TransactionFormDialog
        categories={dashboard.categories}
        mode="edit"
        open={Boolean(editTransaction)}
        transaction={editTransaction}
        wallets={dashboard.wallets}
        onOpenChange={(open) => {
          if (!open) {
            setEditTransaction(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editTransaction) {
            return;
          }

          await toast.promise(handleUpdate(editTransaction.id, values), {
            loading: 'Memperbarui transaksi...',
            success: 'Transaksi berhasil diperbarui',
            error: (error) => (error instanceof Error ? error.message : 'Gagal memperbarui transaksi'),
          });
          setEditTransaction(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTransaction)}
        title="Hapus Transaksi"
        description={`Hapus transaksi ${deleteTransaction?.note || 'tanpa catatan'}? Saldo wallet akan disesuaikan kembali.`}
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTransaction(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteTransaction) {
            return;
          }

          await toast.promise(handleDelete(deleteTransaction.id), {
            loading: 'Menghapus transaksi...',
            success: 'Transaksi berhasil dihapus',
            error: (error) => (error instanceof Error ? error.message : 'Gagal menghapus transaksi'),
          });
          setDeleteTransaction(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Hapus Transaksi Terpilih"
        description={`Hapus ${selectedIds.length} transaksi terpilih? Saldo wallet akan disesuaikan kembali.`}
        confirmLabel="Hapus Semua"
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteOpen(false);
          }
        }}
        onConfirm={async () => {
          await toast.promise(handleBulkDelete(), {
            loading: 'Menghapus transaksi terpilih...',
            success: 'Transaksi terpilih berhasil dihapus',
            error: (error) => (error instanceof Error ? error.message : 'Gagal menghapus transaksi'),
          });
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}