export interface BudgetLimit {
  id: string;
  categoryId: string;
  amount: number;
  alertEnabled?: boolean;
  alertThresholdPct?: number;
  updatedAt: number;
  deletedAt?: number;
}
