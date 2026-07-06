import 'server-only';

import { PrismaCalendarRepository } from '@/features/calendar/calendar.repository';
import type { CalendarDashboard } from '@/features/calendar/calendar.types';

const calendarRepository = new PrismaCalendarRepository();

export class CalendarService {
  async getDashboard(userId: string): Promise<CalendarDashboard> {
    return calendarRepository.getDashboard(userId);
  }
}

export const calendarService = new CalendarService();
