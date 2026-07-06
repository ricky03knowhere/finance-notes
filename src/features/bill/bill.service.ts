import 'server-only';

import { PrismaBillRepository } from '@/features/bill/bill.repository';
import { billCreateSchema, billUpdateSchema, type BillCreateInput, type BillUpdateInput } from '@/features/bill/bill.schema';
import type { BillDashboard, BillSummary } from '@/features/bill/bill.types';

const billRepository = new PrismaBillRepository();

function createSummary(bills: BillDashboard['bills']): BillSummary {
  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = bills.filter((bill) => bill.paid).reduce((sum, bill) => sum + bill.amount, 0);

  return {
    totalBills,
    totalAmount,
    totalPaid,
    totalOutstanding: Math.max(totalAmount - totalPaid, 0),
  };
}

export class BillService {
  async getDashboard(userId: string): Promise<BillDashboard> {
    const bills = await billRepository.listBills(userId);

    return {
      summary: createSummary(bills),
      bills,
    };
  }

  async createBill(userId: string, input: BillCreateInput) {
    const parsed = billCreateSchema.parse(input);
    return billRepository.createBill(userId, parsed);
  }

  async updateBill(userId: string, billId: string, input: BillUpdateInput) {
    const parsed = billUpdateSchema.parse(input);
    return billRepository.updateBill(userId, billId, parsed);
  }

  async deleteBill(userId: string, billId: string) {
    return billRepository.deleteBill(userId, billId);
  }
}

export const billService = new BillService();
