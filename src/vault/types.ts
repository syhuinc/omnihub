import type { EncryptedPayload } from './crypto';

export interface VaultNoteRecord extends EncryptedPayload {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface VaultNote {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}
