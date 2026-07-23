export interface CalendarEvent {
  id: string;
  title: string;
  type: 'transaction' | 'bill';
  date: string;
  amount: number;
  badge: string;
  categoryName: string | null;
  walletName: string | null;
  status: 'upcoming' | 'due' | 'completed';
}

export interface CalendarDaySummary {
  date: string;
  income: number;
  expense: number;
  count: number;
}

export interface CalendarSummary {
  upcomingBills: number;
  upcomingBillAmount: number;
  activeDays: number;
  currentMonthEvents: number;
}

export interface CalendarCountItem {
  label: string;
  value: number;
}

export interface CalendarDashboard {
  summary: CalendarSummary;
  events: CalendarEvent[];
  dailyActivity: CalendarDaySummary[];
  weeklySummary: CalendarCountItem[];
  monthlyTransactions: CalendarCountItem[];
}

export interface YearlyRecapItem {
  amount: number;
  note: string;
}

export interface YearlyRecapMonth {
  month: number;
  monthLabel: string;
  income: number;
  totalSpend: number;
  left: number;
  items: YearlyRecapItem[];
}

export interface YearlyRecap {
  year: number;
  months: YearlyRecapMonth[];
  availableYears: number[];
}
