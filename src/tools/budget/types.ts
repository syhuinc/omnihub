export interface BudgetLimit {
  id: string;
  categoryId: string;
  amount: number;
  updatedAt: number;
  deletedAt?: number;
}
