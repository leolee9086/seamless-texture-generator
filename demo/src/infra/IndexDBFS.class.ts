/**
 * IndexDBFS (IndexedDB File System)
 * 
 * 一个比 idb 更适合本项目的文件系统模拟层。
 * 
 * 特性：
 * 1. **Path-Based API**: 使用 `store/key` 路径风格访问数据，模拟文件系统体验。
 * 2. **Auto Lifecycle**: 自动管理 DB 打开、版本升级和 Store 创建。
 * 3. **Pure Promise**: 完全 Promisified，无回调地狱。
 * 4. **Strict Safety**: 完整的错误处理和类型安全支持。
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

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(this.wrapError('Read failed', request.error));
            } catch (e) {
                reject(this.wrapError('Transaction failed', e));
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
                let request: IDBRequest;
                if (store.keyPath) {
                    // 假设 data 是对象且已包含正确的 key。
                    // 理论上我们应该验证 data[store.keyPath] === key，但这里为了性能先跳过。
                    request = store.put(data);
                } else {
                    request = store.put(data, key);
                }

                request.onsuccess = () => resolve();
                request.onerror = () => reject(this.wrapError('Write failed', request.error));
            } catch (e) {
                reject(this.wrapError('Transaction failed', e));
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

                request.onsuccess = () => resolve();
                request.onerror = () => reject(this.wrapError('Delete failed', request.error));
            } catch (e) {
                reject(this.wrapError('Transaction failed', e));
            }
        });
    }

    /**
     * 列出目录下的所有文件 (Keys)
     * @param dir 目录名 (storeName)
     */
    async list(dir: string): Promise<IDBValidKey[]> {
        if (!this.storeNames.has(dir)) {
            throw new Error(`Directory (Store) not found: ${dir}`);
        }
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(dir, 'readonly');
                const store = tx.objectStore(dir);
                const request = store.getAllKeys();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(this.wrapError('List failed', request.error));
            } catch (e) {
                reject(this.wrapError('Transaction failed', e));
            }
        });
    }

    /**
     * 获取目录下所有文件的内容 (慎用，大数据量可能卡顿)
     * @param dir 目录名 (storeName)
     */
    async readdir<T>(dir: string): Promise<T[]> {
        if (!this.storeNames.has(dir)) {
            throw new Error(`Directory (Store) not found: ${dir}`);
        }
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(dir, 'readonly');
                const store = tx.objectStore(dir);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result as T[]);
                request.onerror = () => reject(this.wrapError('ReadDir failed', request.error));
            } catch (e) {
                reject(this.wrapError('Transaction failed', e));
            }
        });
    }

    /**
     * 清空目录
     * @param dir 目录名 (storeName)
     */
    async clear(dir: string): Promise<void> {
        if (!this.storeNames.has(dir)) {
            throw new Error(`Directory (Store) not found: ${dir}`);
        }
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(dir, 'readwrite');
                const store = tx.objectStore(dir);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(this.wrapError('Clear failed', request.error));
            } catch (e) {
                reject(this.wrapError('Transaction failed', e));
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

                tx.oncomplete = () => {
                    // Transaction auto-commits, but we rely on resolve(result) from inside.
                    // This is just a lifecycle hook.
                };
                tx.onerror = () => reject(this.wrapError('Transaction error', tx.error));
                tx.onabort = () => reject(new Error('Transaction aborted'));

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
            } catch (e) {
                reject(this.wrapError('Create transaction failed', e));
            }
        });
    }

    // --- Internal Helpers ---

    private async ensureDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.openPromise) return this.openPromise;

        this.openPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                this.openPromise = null;
                reject(this.wrapError('Open DB failed', request.error));
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.db.onversionchange = () => {
                    this.db?.close();
                    this.db = null;
                    this.openPromise = null;
                    console.warn(`Database ${this.dbName} needs upgrade. Connection closed.`);
                };
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                this.storeNames.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        // Important: We don't set keyPath here to allow maximum flexibility (File System simulation).
                        // FS uses path (key) to access file.
                        db.createObjectStore(storeName);
                    }
                });
            };
        });

        return this.openPromise;
    }

    private parsePath(path: string): { storeName: string, key: string } {
        const parts = path.split('/');
        if (parts.length < 2) {
            throw new Error(`Invalid path format: "${path}". Expected "storeName/key".`);
        }
        const storeName = parts[0];
        const key = parts.slice(1).join('/'); // Allow keys to have slashes? Maybe. For now, join rest.

        if (!this.storeNames.has(storeName)) {
            throw new Error(`Directory (Store) not valid: "${storeName}". Available: ${Array.from(this.storeNames).join(', ')}`);
        }

        return { storeName, key };
    }

    private wrapError(msg: string, cause: any): Error {
        const err = new Error(`${msg}: ${cause?.message || cause}`);
        (err as any).cause = cause;
        return err;
    }
}
