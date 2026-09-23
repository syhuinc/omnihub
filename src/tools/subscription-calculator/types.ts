export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  cycle: BillingCycle;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
