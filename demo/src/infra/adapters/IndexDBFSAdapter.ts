/**
 * IndexedDB 文件系统适配器
 *
 * 基于现有的 IndexDBFS 封装实现 IFileSystemAdapter 接口。
 * 这是默认的存储后端，支持离线使用，无需用户授权。
 *
 * @限制
 * - 容量受限 (~1GB，因浏览器而异)
 * - 同步操作在主线程，大量操作可能阻塞 UI
 */

import { IndexDBFS } from '../IndexDBFS.class'
import type { IFileSystemAdapter } from './IFileSystemAdapter'

/**
 * IndexedDB 文件系统适配器
 */
export class IndexDBFSAdapter implements IFileSystemAdapter {
    readonly name = 'IndexedDB'

    /** 底层 IndexDBFS 实例 */
    private fs: IndexDBFS

    /**
     * 创建 IndexedDB 适配器
     * @param dbName 数据库名称
     * @param stores ObjectStore 列表 (目录)
     * @param version 数据库版本
     */
    constructor(dbName: string, stores: string[], version: number = 1) {
        this.fs = new IndexDBFS(dbName, stores, version)
    }

    /**
     * 读取文件
     */
    async read<T>(path: string): Promise<T | null> {
        return await this.fs.read<T>(path)
    }

    /**
     * 写入文件
     */
    async write<T>(path: string, data: T): Promise<void> {
        await this.fs.write(path, data)
    }

    /**
     * 删除文件
     */
    async delete(path: string): Promise<void> {
        await this.fs.delete(path)
    }

    /**
     * 列出目录下所有文件名
     */
    async list(dir: string): Promise<string[]> {
        const keys = await this.fs.list(dir)
        // IDBValidKey 可能是 string | number | Date | ArrayBuffer | IDBValidKey[]
        // 转换为统一的字符串格式
        return keys.map(key => String(key))
    }

    /**
     * 读取目录下所有文件内容
     */
    async readdir<T>(dir: string): Promise<T[]> {
        return await this.fs.readdir<T>(dir)
    }

    /**
     * 清空目录
     */
    async clear(dir: string): Promise<void> {
        await this.fs.clear(dir)
    }

    /**
     * 检查适配器是否可用
     * IndexedDB 在现代浏览器中普遍可用
     */
    async isAvailable(): Promise<boolean> {
        // 检查 indexedDB 是否存在
        if (typeof indexedDB === 'undefined') {
            return false
        }

        // 尝试打开一个测试数据库以验证 IndexedDB 可用
        try {
            const testDbName = '__indexeddb_test__'
            const request = indexedDB.open(testDbName)

            return new Promise((resolve) => {
                request.onerror = (): void => resolve(false)
                request.onsuccess = (): void => {
                    request.result.close()
                    // 清理测试数据库
                    indexedDB.deleteDatabase(testDbName)
                    resolve(true)
                }
            })
        } catch {
            return false
        }
    }
}
