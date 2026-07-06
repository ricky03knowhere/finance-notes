export interface BillRecord {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  recurring: boolean;
  paid: boolean;
}

export interface BillSummary {
  totalBills: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface BillDashboard {
  summary: BillSummary;
  bills: BillRecord[];
}
