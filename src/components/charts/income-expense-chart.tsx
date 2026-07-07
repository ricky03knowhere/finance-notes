'use client';

import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { IncomeExpensePoint } from '@/features/dashboard/dashboard.types';
import { formatCurrency } from '@/lib/utils';

export default function IncomeExpenseChart({ data }: { data: IncomeExpensePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--muted-foreground)" />
        <YAxis stroke="var(--muted-foreground)" />
        <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
        <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
