import { requireUser } from '@/lib/auth';
import { calendarService } from '@/features/calendar/calendar.service';
import { CalendarManager } from '@/app/(dashboard)/calendar/_components/calendar-manager';

export default async function CalendarPage() {
  const user = await requireUser();
  const dashboard = await calendarService.getDashboard(user.id);

  return <CalendarManager initialDashboard={dashboard} />;
}
