import 'server-only';

import { PrismaAnalyticsRepository } from '@/features/analytics/analytics.repository';
import type { AnalyticsDashboard } from '@/features/analytics/analytics.types';

const analyticsRepository = new PrismaAnalyticsRepository();

export class AnalyticsService {
  async getDashboard(userId: string): Promise<AnalyticsDashboard> {
    return analyticsRepository.getDashboard(userId);
  }
}

export const analyticsService = new AnalyticsService();
