import { FirebaseFirestore } from '@capacitor-firebase/firestore';

export interface SyncItem {
  id: string;
  updatedAt: number;
  deletedAt?: number;
}

interface SyncEngineOptions<T extends SyncItem> {
  collection: string;
  getLocal: () => T[];
  setLocal: (items: T[]) => void;
}

export interface SyncEngine<T extends SyncItem> {
  start: (uid: string) => Promise<void>;
  stop: () => Promise<void>;
  pushUpsert: (uid: string, item: T) => Promise<void>;
  pushDelete: (uid: string, id: string, deletedAt: number) => Promise<void>;
}

export function createSyncEngine<T extends SyncItem>(opts: SyncEngineOptions<T>): SyncEngine<T> {
  let callbackId: string | null = null;

  function collectionPath(uid: string) {
    return `users/${uid}/${opts.collection}`;
  }

  async function initialMerge(uid: string) {
    const localItems = opts.getLocal();
    let remoteItems: T[] = [];
    try {
      const { snapshots } = await FirebaseFirestore.getCollection<T>({ reference: collectionPath(uid) });
      remoteItems = snapshots.map((s) => s.data).filter((d): d is T => d != null);
    } catch {
      return;
    }

    const merged = new Map<string, T>(localItems.map((i) => [i.id, i]));
    const toPush: T[] = [];
    const remoteIds = new Set(remoteItems.map((r) => r.id));

    for (const remote of remoteItems) {
      const local = merged.get(remote.id);
      if (!local || remote.updatedAt > local.updatedAt) {
        merged.set(remote.id, remote);
      } else if (local.updatedAt > remote.updatedAt) {
        toPush.push(local);
      }
    }
    for (const local of localItems) {
      if (!remoteIds.has(local.id)) toPush.push(local);
    }

    const visible = [...merged.values()].filter((i) => !i.deletedAt);
    opts.setLocal(visible);

    if (toPush.length) {
      try {
        await FirebaseFirestore.writeBatch({
          operations: toPush.map((item) => ({
            type: 'set' as const,
            reference: `${collectionPath(uid)}/${item.id}`,
            data: item,
            options: { merge: true },
          })),
        });
      } catch {
        // best-effort — will retry on next mutation or sign-in
      }
    }
  }

  async function start(uid: string) {
    await initialMerge(uid);
    try {
      callbackId = await FirebaseFirestore.addCollectionSnapshotListener<T>(
        { reference: collectionPath(uid) },
        (event) => {
          if (!event) return;
          const remoteItems = event.snapshots.map((s) => s.data).filter((d): d is T => d != null);
          const localItems = opts.getLocal();
          const localMap = new Map(localItems.map((i) => [i.id, i]));
          let changed = false;
          for (const remote of remoteItems) {
            const local = localMap.get(remote.id);
            if (!local || remote.updatedAt > local.updatedAt) {
              if (remote.deletedAt) {
                if (local) {
                  localMap.delete(remote.id);
                  changed = true;
                }
              } else {
                localMap.set(remote.id, remote);
                changed = true;
              }
            }
          }
          if (changed) opts.setLocal([...localMap.values()].filter((i) => !i.deletedAt));
        },
      );
    } catch {
      // web fallback / listener unavailable — initial merge already ran
    }
  }

  async function stop() {
    if (callbackId) {
      try {
        await FirebaseFirestore.removeSnapshotListener({ callbackId });
      } catch {
        // ignore
      }
      callbackId = null;
    }
  }

  async function pushUpsert(uid: string, item: T) {
    try {
      await FirebaseFirestore.setDocument({
        reference: `${collectionPath(uid)}/${item.id}`,
        data: item,
        merge: true,
      });
    } catch {
      // offline or transient — Firestore's local queue (native) retries; web best-effort
    }
  }

  async function pushDelete(uid: string, id: string, deletedAt: number) {
    try {
      await FirebaseFirestore.setDocument({
        reference: `${collectionPath(uid)}/${id}`,
        data: { id, updatedAt: deletedAt, deletedAt },
        merge: true,
      });
    } catch {
      // offline or transient
    }
  }

  return { start, stop, pushUpsert, pushDelete };
}
