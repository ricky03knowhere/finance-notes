import 'server-only';

import { dashboardRepository } from '@/features/dashboard/dashboard.repository';
import type { Dashboard } from '@/features/dashboard/dashboard.types';

export class DashboardService {
  async getDashboard(userId: string): Promise<Dashboard> {
    return dashboardRepository.getDashboard(userId);
  }
}

export const dashboardService = new DashboardService();
