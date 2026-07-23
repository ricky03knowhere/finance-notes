import 'server-only';

import { PrismaCalendarRepository } from '@/features/calendar/calendar.repository';
import type { CalendarDashboard, YearlyRecap } from '@/features/calendar/calendar.types';

const calendarRepository = new PrismaCalendarRepository();

export class CalendarService {
  async getDashboard(userId: string): Promise<CalendarDashboard> {
    return calendarRepository.getDashboard(userId);
  }

  async getYearlyRecap(userId: string, year: number): Promise<YearlyRecap> {
    return calendarRepository.getYearlyRecap(userId, year);
  }
}

export const calendarService = new CalendarService();

