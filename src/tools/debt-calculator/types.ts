export type DebtDirection = 'owed_to_me' | 'i_owe';

export interface DebtEntry {
  id: string;
  person: string;
  amount: number;
  direction: DebtDirection;
  note?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
