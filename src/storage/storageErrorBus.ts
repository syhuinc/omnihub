/** Minimal pub/sub so storageSet() (a plain module, not a component) can surface a failed write
 *  to the UI without importing React or threading a callback through 70+ call sites. */
type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function notifyStorageError(message: string): void {
  listeners.forEach((listener) => listener(message));
}

export function subscribeStorageError(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
