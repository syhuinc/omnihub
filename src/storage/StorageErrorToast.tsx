import { useEffect, useState } from 'react';
import { subscribeStorageError } from './storageErrorBus';
import './StorageErrorToast.css';

const VISIBLE_MS = 4000;

export function StorageErrorToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsubscribe = subscribeStorageError((next) => {
      setMessage(next);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), VISIBLE_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="storage-error-toast" role="alert">
      {message}
    </div>
  );
}
