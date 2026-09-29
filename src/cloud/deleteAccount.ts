import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';

/** Every Firestore subcollection a signed-in user's data can live in, under users/{uid}/. */
const SYNCED_COLLECTIONS = [
  'notes',
  'checklists',
  'expenses',
  'budgets',
  'subscriptions',
  'debts',
  'alarms',
  'vault',
];

const BATCH_LIMIT = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function deleteCollection(uid: string, collection: string): Promise<void> {
  const reference = `users/${uid}/${collection}`;
  const { snapshots } = await FirebaseFirestore.getCollection({ reference });
  if (!snapshots.length) return;
  for (const group of chunk(snapshots, BATCH_LIMIT)) {
    await FirebaseFirestore.writeBatch({
      operations: group.map((doc) => ({
        type: 'delete' as const,
        reference: `${reference}/${doc.id}`,
      })),
    });
  }
}

/**
 * Deletes every synced document for the signed-in user, then the Firebase Auth account
 * itself. Firestore's security rules only allow a user to touch their own documents while
 * still authenticated, so the data has to go first - deleting the account first would lock
 * the client out of its own cleanup.
 *
 * Google sign-in sessions can go stale enough that Firebase requires a fresh credential
 * before allowing account deletion (`auth/requires-recent-login`); on that error this
 * re-triggers Google sign-in once and retries.
 */
export async function deleteAccountAndData(
  uid: string,
  reauthenticate: () => Promise<void>,
): Promise<void> {
  for (const collection of SYNCED_COLLECTIONS) {
    await deleteCollection(uid, collection);
  }

  try {
    await FirebaseAuthentication.deleteUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/requires-recent-login/i.test(message)) throw err;
    await reauthenticate();
    await FirebaseAuthentication.deleteUser();
  }
}
