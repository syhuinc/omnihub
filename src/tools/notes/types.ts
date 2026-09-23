export const NOTE_COLORS = ['blue', 'green', 'orange', 'pink', 'purple'] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export const NOTE_CATEGORIES = ['Uncategorized', 'Personal', 'Work', 'Ideas'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  favorited?: boolean;
  color?: NoteColor;
  category?: NoteCategory;
  trashedAt?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
