/**
 * IndexDBFS 相关的错误消息模板
 */

/** 无效的路径格式 */
export const 路径格式无效 = (path: string): string =>
    `Invalid path format: "${path}". Expected "storeName/key".`;

/** 目录 (Store) 未找到 */
export const 目录未找到 = (dir: string): string =>
    `Directory (Store) not found: ${dir}`;

/** 目录 (Store) 无效并列出可用目录 */
export const 目录无效 = (storeName: string, available: string[]): string =>
    `Directory (Store) not valid: "${storeName}". Available: ${available.join(', ')}`;

/** 操作失败的通用包装 */
export const 操作失败 = (操作名: string, 原因: string): string =>
    `${操作名}: ${原因}`;

/** 需要升级版本时的警告 */
export const 数据库需要升级 = (数据库名: string): string =>
    `Database ${数据库名} needs upgrade. Connection closed.`;

/** 事务中止 */
export const 事务中止 = (): string => 'Transaction aborted';
