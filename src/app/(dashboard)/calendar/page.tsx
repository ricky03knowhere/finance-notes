import dayjs from 'dayjs';

import { requireUser } from '@/lib/auth';
import { calendarService } from '@/features/calendar/calendar.service';
import { CalendarManager } from '@/app/(dashboard)/calendar/_components/calendar-manager';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const year = params.year ? Number(params.year) : dayjs().year();
  const recap = await calendarService.getYearlyRecap(user.id, year);

  return <CalendarManager initialRecap={recap} />;
}
