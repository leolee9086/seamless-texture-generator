/**
 * IndexedDB 相关类型守卫
 */

/**
 * 检查是否为 IDBOpenDBRequest
 */
export function isIDBOpenDBRequest(target: unknown): target is IDBOpenDBRequest {
  return target instanceof IDBOpenDBRequest
}

/**
 * 检查是否为 IDBDatabase
 */
export function isIDBDatabase(target: unknown): target is IDBDatabase {
  return target instanceof IDBDatabase
}

/**
 * 检查是否为 IDBRequest
 */
export function isIDBRequest(target: unknown): target is IDBRequest {
  return target instanceof IDBRequest
}

/**
 * 检查是否为 IDBTransaction
 */
export function isIDBTransaction(target: unknown): target is IDBTransaction {
  return target instanceof IDBTransaction
}

/**
 * 检查是否为 IDBObjectStore
 */
export function isIDBObjectStore(target: unknown): target is IDBObjectStore {
  return target instanceof IDBObjectStore
}