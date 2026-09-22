import { FirebaseFirestore } from '@capacitor-firebase/firestore';

export interface SyncItem {
  id: string;
  updatedAt: number;
  deletedAt?: number;
}

interface SyncEngineOptions<T extends SyncItem> {
  collection: string;
  getLocal: () => T[] | Promise<T[]>;
  setLocal: (items: T[]) => void | Promise<void>;
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
    let localItems: T[];
    try {
      localItems = await opts.getLocal();
    } catch {
      // best-effort — treat as "no local data yet" rather than aborting the whole merge, which
      // for an async getLocal (a native round-trip, unlike localStorage) would otherwise also
      // stop start() below from ever reaching the live-listener attachment
      localItems = [];
    }
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
    try {
      await opts.setLocal(visible);
    } catch {
      // best-effort — the live listener (attached regardless by start(), below) will retry via future events
    }

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
    try {
      await initialMerge(uid);
    } catch {
      // best-effort — still attach the live listener below regardless, so ongoing sync isn't
      // permanently broken by a one-time failure during the initial merge
    }
    try {
      callbackId = await FirebaseFirestore.addCollectionSnapshotListener<T>(
        { reference: collectionPath(uid) },
        async (event) => {
          if (!event) return;
          try {
            const remoteItems = event.snapshots.map((s) => s.data).filter((d): d is T => d != null);
            const localItems = await opts.getLocal();
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
            if (changed) await opts.setLocal([...localMap.values()].filter((i) => !i.deletedAt));
          } catch {
            // best-effort — a transient local read/write failure on this event shouldn't break
            // the listener for future events (nothing re-throws out of this callback either way,
            // but this keeps the failure from being an unhandled rejection floating around)
          }
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
