import 'server-only';

import { PrismaReportRepository } from '@/features/report/report.repository';
import type { ReportDashboard } from '@/features/report/report.types';

const reportRepository = new PrismaReportRepository();

export class ReportService {
  async getDashboard(userId: string): Promise<ReportDashboard> {
    return reportRepository.getDashboard(userId);
  }
}

export const reportService = new ReportService();
