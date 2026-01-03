import { QueryClient } from '@tanstack/react-query';
import {
  PersistedClient,
  Persister,
  persistQueryClient,
} from '@tanstack/react-query-persist-client';

class IndexedDBPersister {
  private dbName = 'FernLabourQueryCache';
  private storeName = 'queryCache';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async setItem(key: string, value: any): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put({
        key,
        value,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem(key: string): Promise<any> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : undefined);
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export function createIDBPersister(key: string) {
  const persister = new IndexedDBPersister();

  return {
    persistClient: async (client: PersistedClient) => {
      await persister.setItem(key, client);
    },
    restoreClient: async () => {
      return await persister.getItem(key);
    },
    removeClient: async () => {
      await persister.removeItem(key);
    },
  } satisfies Persister;
}

export async function initializeQueryPersistence(queryClient: QueryClient): Promise<void> {
  try {
    persistQueryClient({
      queryClient,
      persister: createIDBPersister('queryClient'),
      maxAge: 24 * 60 * 60 * 1000,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          return query.state.status === 'success';
        },
      },
    });
  } catch (error) {
    // Continue without persistence rather than break the app
  }
}

export async function clearQueryPersistence(): Promise<void> {
  const persister = new IndexedDBPersister();

  try {
    await persister.clear();
  } catch (error) {
    // Do nothing
  }
}

export async function getQueryCacheStats() {
  try {
    const estimate = await navigator.storage?.estimate?.();

    return {
      usage: estimate?.usage || 0,
      quota: estimate?.quota || 0,
      usagePercent: estimate?.quota ? Math.round((estimate.usage! / estimate.quota) * 100) : 0,
    };
  } catch (error) {
    return { usage: 0, quota: 0, usagePercent: 0 };
  }
}
