import {
    路径格式无效,
    目录未找到,
    目录无效,
    操作失败,
    数据库需要升级,
    事务中止,
    写入失败缺少KeyPath属性
} from './IndexDBFS.templates';
import { isArray } from './IndexDBFS.guard';

/**
 * IndexDBFS (IndexedDB File System)
 *
 * @example
 * const fs = new IndexDBFS('MyAppDB', ['luts', 'images']);
 * await fs.write('luts/my-lut-1', { ... });
 * const data = await fs.read('luts/my-lut-1');
 */

export class IndexDBFS {
    private dbName: string;
    private storeNames: Set<string>;
    private db: IDBDatabase | null = null;
    private version: number;
    private openPromise: Promise<IDBDatabase> | null = null;

    /**
     * @param dbName 数据库名称
     * @param stores 需要创建的 ObjectStore 列表 (相当于目录)
     * @param version 数据库版本 (默认 1)
     */
    constructor(dbName: string, stores: string[], version: number = 1) {
        this.dbName = dbName;
        this.storeNames = new Set(stores);
        this.version = version;
    }

    /**
     * 读取文件
     * @param path 格式 "storeName/key"
     */
    async read<T>(path: string): Promise<T | null> {
        const { storeName, key } = this.parsePath(path);
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = (): void => resolve(request.result || null);
                request.onerror = (): void => reject(wrapError(操作失败, 'Read', request.error));
            } catch (error) {
                reject(wrapError(操作失败, 'Transaction', error));
            }
        });
    }

    /**
     * 写入文件
     * @param path 格式 "storeName/key"
     * @param data 数据
     */
    async write<T>(path: string, data: T): Promise<void> {
        const { storeName, key } = this.parsePath(path);
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);

                // 兼容性处理：检查是否使用了内联键 (keyPath)
                // 如果 Store 定义了 keyPath (如 'id', 'url')，则 put 不能传第二个参数，且 data 必须包含该属性。
                // 如果 Store 没有 keyPath，则必须传第二个参数作为 key。
                // @AIDONE: keyPath 验证已实现

                // 有 keyPath 时验证 data 是否包含必需的 key 属性
                if (store.keyPath) {
                    const keyPaths = Array.isArray(store.keyPath) ? store.keyPath : [store.keyPath];
                    for (const kp of keyPaths) {
                        if (typeof data !== 'object' || data === null || !(kp in data)) {
                            throw new Error(写入失败缺少KeyPath属性(storeName, kp));
                        }
                    }
                }

                const request = store.keyPath
                    ? store.put(data)       // 有 keyPath: data 自带 key，不传第二参数
                    : store.put(data, key); // 无 keyPath: 必须显式传 key

                request.onsuccess = (): void => resolve();
                request.onerror = (): void => reject(wrapError(操作失败, 'Write', request.error));
            } catch (error) {
                reject(wrapError(操作失败, 'Transaction', error));
            }
        });
    }


    /**
     * 删除文件
     * @param path 格式 "storeName/key"
     */
    async delete(path: string): Promise<void> {
        const { storeName, key } = this.parsePath(path);
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = (): void => resolve();
                request.onerror = (): void => reject(wrapError(操作失败, 'Delete', request.error));
            } catch (error) {
                reject(wrapError(操作失败, 'Transaction', error));
            }
        });
    }

    /**
     * 列出目录下的所有文件 (Keys)
     * @param dir 目录名 (storeName)
     */
    async list(dir: string): Promise<IDBValidKey[]> {
        if (!this.storeNames.has(dir)) {
            throw new Error(目录未找到(dir));
        }
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(dir, 'readonly');
                const store = tx.objectStore(dir);
                const request = store.getAllKeys();

                request.onsuccess = (): void => resolve(request.result);
                request.onerror = (): void => reject(wrapError(操作失败, 'List', request.error));
            } catch (error) {
                reject(wrapError(操作失败, 'Transaction', error));
            }
        });
    }

    /**
     * 获取目录下所有文件的内容 (慎用，大数据量可能卡顿)
     * @param dir 目录名 (storeName)
     */
    async readdir<T>(dir: string): Promise<T[]> {
        if (!this.storeNames.has(dir)) {
            throw new Error(目录未找到(dir));
        }
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(dir, 'readonly');
                const store = tx.objectStore(dir);
                const request = store.getAll();

                request.onsuccess = (): void => {
                    const result = request.result;
                    // 卫语句：非数组情况提前处理
                    if (!isArray<T>(result)) {
                        resolve([]);
                        return;
                    }
                    resolve(result);
                };
                request.onerror = (): void => reject(wrapError(操作失败, 'ReadDir', request.error));
            } catch (error) {
                reject(wrapError(操作失败, 'Transaction', error));
            }
        });
    }

    /**
     * 清空目录
     * @param dir 目录名 (storeName)
     */
    async clear(dir: string): Promise<void> {
        if (!this.storeNames.has(dir)) {
            throw new Error(目录未找到(dir));
        }
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(dir, 'readwrite');
                const store = tx.objectStore(dir);
                const request = store.clear();

                request.onsuccess = (): void => resolve();
                request.onerror = (): void => reject(wrapError(操作失败, 'Clear', request.error));
            } catch (error) {
                reject(wrapError(操作失败, 'Transaction', error));
            }
        });
    }

    /**
     * 原子性批处理 (Transaction Wrapper)
     * @param stores 涉及的目录 (storeNames)
     * @param mode 事务模式
     * @param callback 在事务中执行的操作
     */
    async transaction<T>(
        stores: string[],
        mode: IDBTransactionMode,
        callback: (tx: IDBTransaction) => Promise<T>
    ): Promise<T> {
        const db = await this.ensureDB();
        return new Promise(async (resolve, reject) => {
            try {
                const tx = db.transaction(stores, mode);

                /**
                 * @简洁函数 事务完成生命周期钩子，用于监听事务自动提交事件
                 * 这是一个事件处理器，用于监听 IndexedDB 事务的自动提交事件。
                 * 事务在所有请求成功完成后会自动提交，此函数作为生命周期钩子存在。
                 */
                tx.oncomplete = (): void => {
                    // Transaction auto-commits, but we rely on resolve(result) from inside.
                    // This is just a lifecycle hook that logs transaction completion.
                    // Note: This function intentionally kept minimal as it's just a lifecycle hook.
                };
                tx.onerror = (): void => reject(wrapError(操作失败, 'Transaction', tx.error));
                tx.onabort = (): void => reject(new Error(事务中止()));

                try {
                    const result = await callback(tx);
                    resolve(result);
                } catch (err) {
                    // Callback failed, manually abort if it hasn't already
                    if (tx.error === null) {
                        // Note: calling abort() might not throw immediately, 
                        // but will trigger onabort which rejects the outer promise
                        try { tx.abort(); } catch { }
                    }
                    reject(err);
                }
            } catch (error) {
                reject(wrapError(操作失败, 'Create transaction', error));
            }
        });
    }

    // --- Internal Helpers ---

    private async ensureDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.openPromise) return this.openPromise;

        this.openPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (): void => {
                this.openPromise = null;
                reject(wrapError(操作失败, 'Open DB', request.error));
            };

            request.onsuccess = (): void => {
                this.db = request.result;
                this.db.onversionchange = (): void => {
                    this.db?.close();
                    this.db = null;
                    this.openPromise = null;
                    console.warn(数据库需要升级(this.dbName));
                };
                resolve(this.db);
            };

            request.onupgradeneeded = (): void => {
                const db = request.result;
                for (const storeName of this.storeNames) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        // Important: We don't set keyPath here to allow maximum flexibility (File System simulation).
                        // FS uses path (key) to access file.
                        db.createObjectStore(storeName);
                    }
                }
            };
        });

        return this.openPromise;
    }

    private parsePath(path: string): { storeName: string, key: string } {
        const parts = path.split('/');
        if (parts.length < 2) {
            throw new Error(路径格式无效(path));
        }
        const storeName = parts[0];
        const key = parts.slice(1).join('/'); // Allow keys to have slashes? Maybe. For now, join rest.

        if (!this.storeNames.has(storeName)) {
            throw new Error(目录无效(storeName, Array.from(this.storeNames)));
        }

        return { storeName, key };
    }


}

function wrapError(
    模板函数: (操作名: string, 原因: string) => string,
    操作名: string,
    cause: unknown
): Error {
    const 原因字符串 = cause instanceof Error ? cause.message : String(cause);
    // ES2022: 使用标准 Error 构造函数的 cause 选项
    return new Error(模板函数(操作名, 原因字符串), { cause });
}

