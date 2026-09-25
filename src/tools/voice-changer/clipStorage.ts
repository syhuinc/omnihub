/**
 * Saved Voice Changer clips, in IndexedDB rather than the app's usual localStorage-based
 * storage/db.ts — that module stores small JSON, and base64-stringifying a WAV blob (often
 * several hundred KB to a couple of MB) into localStorage would eat into the shared 5-10MB quota
 * every other tool's data also lives in. IndexedDB has native Blob support and a much larger
 * practical quota, so clips live here instead.
 */

export interface SavedClip {
  id: string;
  name: string;
  createdAt: number;
  durationSeconds: number;
  effectLabel: string;
  blob: Blob;
}

const DB_NAME = 'omnihub-voice-changer';
const STORE = 'clips';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveClip(clip: SavedClip): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(clip);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listClips(): Promise<SavedClip[]> {
  const db = await openDb();
  const clips = await new Promise<SavedClip[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as SavedClip[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return clips.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteClip(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function renameClip(id: string, name: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.get(id);
    req.onsuccess = () => {
      const clip = req.result as SavedClip | undefined;
      if (clip) store.put({ ...clip, name });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
