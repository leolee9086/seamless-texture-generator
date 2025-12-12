import type { LUTItem } from './lutDb.types';
import { DB_NAME, DB_VERSION, STORE_NAME } from './LUTDB.constants';

export class LUTDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async addLUT(lut: LUTItem): Promise<void> {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(lut);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllLUTs(): Promise<LUTItem[]> {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by createdAt desc
                const result = request.result as LUTItem[];
                result.sort((a, b) => b.createdAt - a.createdAt);
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteLUT(id: string): Promise<void> {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updateLUTThumbnail(id: string, thumbnail: string): Promise<void> {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const data = getRequest.result as LUTItem;
                // 卫语句：先处理异常情况
                if (!data) {
                    reject(new Error('LUT not found'));
                    return;
                }
                // 正常逻辑
                data.thumbnail = thumbnail;
                const updateRequest = store.put(data);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    private async ensureDB(): Promise<void> {
        if (!this.db) {
            await this.init();
        }
    }
}
