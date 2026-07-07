'use client';

import { create } from 'zustand';
import type { Dashboard } from '@/features/dashboard/dashboard.types';

type State = {
  dashboard?: Dashboard | null;
  updatedAt?: number;
  setDashboard: (d: Dashboard) => void;
};

export const useDashboardStore = create<State>((set) => ({
  dashboard: null,
  updatedAt: undefined,
  setDashboard: (d: Dashboard) => set({ dashboard: d, updatedAt: Date.now() }),
}));
