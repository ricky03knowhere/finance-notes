'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, Trash2, Shapes } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { fetcher } from '@/lib/swr';
import type { CategoryDashboard, CategoryRecord } from '@/features/category/category.types';
import { CategoryFormDialog, type CategoryFormValues } from '@/app/(dashboard)/categories/_components/category-form-dialog';

const categoryTypeLabel: Record<CategoryRecord['type'], string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
};

type CategoryManagerProps = {
  initialDashboard: CategoryDashboard;
};

export function CategoryManager({ initialDashboard }: CategoryManagerProps) {
  const { data, mutate } = useSWR<{ dashboard: CategoryDashboard }>('/api/categories', fetcher, {
    fallbackData: { dashboard: initialDashboard },
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const dashboard = data?.dashboard ?? initialDashboard;
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryRecord | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryRecord | null>(null);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Category', value: dashboard.summary.totalCategories, icon: Shapes },
      { label: 'Income Category', value: dashboard.summary.incomeCategories, icon: FolderOpen },
      { label: 'Expense Category', value: dashboard.summary.expenseCategories, icon: FolderOpen },
    ],
    [dashboard.summary],
  );

  async function handleCreate(values: CategoryFormValues) {
    const optimisticCategory: CategoryRecord = {
      id: crypto.randomUUID(),
      name: values.name,
      type: values.type,
      color: values.color,
      icon: values.icon,
      transactionCount: 0,
    };

    await mutate(
      async () => {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Gagal membuat kategori');
        }

        return response.json();
      },
      { optimisticData: { dashboard: { ...dashboard, categories: [optimisticCategory, ...dashboard.categories], summary: { ...dashboard.summary, totalCategories: dashboard.summary.totalCategories + 1, incomeCategories: dashboard.summary.incomeCategories + (values.type === 'INCOME' ? 1 : 0), expenseCategories: dashboard.summary.expenseCategories + (values.type === 'EXPENSE' ? 1 : 0), }, }, }, revalidate: true },
    );
  }

  async function handleUpdate(categoryId: string, values: CategoryFormValues) {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Gagal memperbarui kategori');
    }

    await mutate();
  }

  async function handleDelete(categoryId: string) {
    await mutate(
      async () => {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Gagal menghapus kategori');
        }

        return response.json();
      },
      { optimisticData: { dashboard: { ...dashboard, categories: dashboard.categories.filter((category) => category.id !== categoryId), summary: { ...dashboard.summary, totalCategories: Math.max(dashboard.summary.totalCategories - 1, 0), }, }, }, revalidate: true },
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline" className="w-fit">
              Dashboard / Category
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Kelola kategori income dan expense.</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Susun label transaksi yang jelas supaya laporan dan analitik tetap rapi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Kategori Baru
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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
                  <CardTitle className="text-2xl">{item.value}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>Semua kategori yang tersedia untuk transaksi.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.categories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Belum ada kategori</p>
              <p className="mt-2 text-sm text-muted-foreground">Tambahkan kategori income atau expense untuk memulai.</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)} variant="secondary">
                <Plus className="h-4 w-4" />
                Buat Kategori
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.categories.map((category) => (
                <motion.article key={category.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full border-border/70 bg-background/70">
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-semibold text-white shadow-soft" style={{ backgroundColor: category.color }}>
                            {category.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{categoryTypeLabel[category.type]}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{category.type}</Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Used in</p>
                        <p className="text-2xl font-semibold">{category.transactionCount} transaksi</p>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditCategory(category)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteCategory(category)}>
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

      <CategoryFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          await toast.promise(handleCreate(values), {
            loading: 'Menyimpan kategori...',
            success: 'Kategori berhasil dibuat',
            error: (error) => (error instanceof Error ? error.message : 'Gagal membuat kategori'),
          });
          setCreateOpen(false);
        }}
      />

      <CategoryFormDialog
        mode="edit"
        open={Boolean(editCategory)}
        category={editCategory}
        onOpenChange={(open) => {
          if (!open) {
            setEditCategory(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editCategory) {
            return;
          }

          await toast.promise(handleUpdate(editCategory.id, values), {
            loading: 'Memperbarui kategori...',
            success: 'Kategori berhasil diperbarui',
            error: (error) => (error instanceof Error ? error.message : 'Gagal memperbarui kategori'),
          });
          setEditCategory(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteCategory)}
        title="Hapus Kategori"
        description={`Hapus kategori ${deleteCategory?.name ?? ''}? Transaksi yang terkait akan tetap tersimpan tanpa kategori.`}
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCategory(null);
          }
        }}
        onConfirm={async () => {
          if (!deleteCategory) {
            return;
          }

          await handleDelete(deleteCategory.id);
          setDeleteCategory(null);
        }}
      />
    </div>
  );
}