import { IExtractor } from '../types';

export interface IndexedDBExtractorConfig {
  storeName: string;
  query?: IDBKeyRange | any;
  index?: string;
  direction?: IDBCursorDirection;
  limit?: number;
}

/**
 * IndexedDB Extractor - extracts data from IndexedDB
 */
export class IndexedDBExtractor implements IExtractor {
  readonly name = 'indexedDB';

  async extract(config: IndexedDBExtractorConfig): Promise<any> {
    const { storeName, query, index, direction = 'next', limit } = config;

    if (!storeName) {
      throw new Error('Store name is required for IndexedDB extraction');
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not available in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('browser-etl-db', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        let objectStore = store;
        if (index) {
          objectStore = store.index(index);
        }

        const results: any[] = [];
        const cursorRequest = objectStore.openCursor(query, direction);

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            results.push(cursor.value);
            
            if (limit && results.length >= limit) {
              resolve(results);
              return;
            }
            
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        cursorRequest.onerror = () => reject(new Error('Failed to read from IndexedDB'));
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  supports(config: any): boolean {
    return config && typeof config.storeName === 'string';
  }
}