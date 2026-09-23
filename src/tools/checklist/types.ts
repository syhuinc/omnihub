export const CHECKLIST_CATEGORIES = ['Personal', 'Work', 'Study'] as const;

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  dueAt?: number;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  category?: string;
  items: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
