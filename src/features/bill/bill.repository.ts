import 'server-only';

import { prisma } from '@/lib/prisma';
import type { BillCreateInput, BillUpdateInput } from '@/features/bill/bill.schema';
import type { BillRecord } from '@/features/bill/bill.types';

type BillRow = {
  id: string;
  title: string;
  amount: { toString(): string };
  dueDate: Date;
  recurring: boolean;
  paid: boolean;
};

function mapBill(bill: BillRow): BillRecord {
  return {
    id: bill.id,
    title: bill.title,
    amount: Number(bill.amount),
    dueDate: bill.dueDate.toISOString(),
    recurring: bill.recurring,
    paid: bill.paid,
  };
}

export interface BillRepository {
  listBills(userId: string): Promise<BillRecord[]>;
  createBill(userId: string, input: BillCreateInput): Promise<BillRecord>;
  updateBill(userId: string, billId: string, input: BillUpdateInput): Promise<BillRecord>;
  deleteBill(userId: string, billId: string): Promise<void>;
}

export class PrismaBillRepository implements BillRepository {
  async listBills(userId: string) {
    const bills = await prisma.bill.findMany({
      where: { userId },
      orderBy: [{ paid: 'asc' }, { dueDate: 'asc' }],
    });

    return bills.map(mapBill);
  }

  async createBill(userId: string, input: BillCreateInput) {
    const bill = await prisma.bill.create({
      data: {
        userId,
        title: input.title,
        amount: input.amount,
        dueDate: new Date(input.dueDate),
        recurring: input.recurring,
        paid: input.paid,
      },
    });

    return mapBill(bill);
  }

  async updateBill(userId: string, billId: string, input: BillUpdateInput) {
    const updated = await prisma.bill.updateMany({
      where: { id: billId, userId },
      data: {
        title: input.title,
        amount: input.amount,
        dueDate: new Date(input.dueDate),
        recurring: input.recurring,
        paid: input.paid,
      },
    });

    if (updated.count === 0) {
      throw new Error('Tagihan tidak ditemukan');
    }

    const bill = await prisma.bill.findFirstOrThrow({ where: { id: billId, userId } });
    return mapBill(bill);
  }

  async deleteBill(userId: string, billId: string) {
    await prisma.bill.deleteMany({ where: { id: billId, userId } });
  }
}
