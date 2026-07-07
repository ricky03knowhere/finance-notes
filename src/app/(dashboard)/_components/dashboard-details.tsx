'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Dashboard } from '@/features/dashboard/dashboard.types';
import { formatCurrency } from '@/lib/utils';

export default function DashboardDetails({ dashboard }: { dashboard: Dashboard }) {
  return (
    <div className="space-y-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>Pengeluaran terbesar berdasarkan kategori.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {dashboard.topCategories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <p className="text-base font-medium">Tidak ada data kategori</p>
            </div>
          ) : (
            dashboard.topCategories.map((category) => (
              <div key={category.categoryName} className="rounded-3xl border border-border bg-background p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{category.categoryName}</p>
                  <p className="mt-1 text-base font-semibold">{formatCurrency(category.amount)}</p>
                </div>
                <Badge variant="outline">Top</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
