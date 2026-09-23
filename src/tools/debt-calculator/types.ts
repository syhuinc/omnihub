export type DebtDirection = 'owed_to_me' | 'i_owe';

export interface DebtEntry {
  id: string;
  person: string;
  debtName?: string;
  amount: number;
  currency?: string;
  direction: DebtDirection;
  note?: string;
  dueAt?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
