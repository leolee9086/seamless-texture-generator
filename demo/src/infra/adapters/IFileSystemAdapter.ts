/**
 * 统一文件系统适配器接口
 *
 * 所有存储后端 (IndexedDB、File System Access API、云存储等) 必须实现此接口。
 * 业务层代码通过此接口与存储层交互，实现完全解耦。
 *
 * @设计原则
 * - 依赖倒置：业务代码依赖抽象接口而非具体实现
 * - 可扩展性：可在运行时切换适配器（如用户授权 File System Access 后）
 * - 一致性：所有适配器提供相同的 API，业务代码无需感知底层差异
 */

/**
 * 文件系统适配器接口
 *
 * 路径格式说明：
 * - 路径格式为 "目录/文件名"，如 "projects/abc123"
 * - 不同适配器内部转换为各自的存储结构
 */
export interface IFileSystemAdapter {
    /** 适配器名称 (用于调试/日志/UI 显示) */
    readonly name: string

    /**
     * 读取文件
     * @param path 文件路径，格式 "目录/文件名"
     * @returns 文件内容，不存在时返回 null
     */
    read<T>(path: string): Promise<T | null>

    /**
     * 写入文件
     * @param path 文件路径，格式 "目录/文件名"
     * @param data 要写入的数据
     */
    write<T>(path: string, data: T): Promise<void>

    /**
     * 删除文件
     * @param path 文件路径，格式 "目录/文件名"
     */
    delete(path: string): Promise<void>

    /**
     * 列出目录下所有文件名
     * @param dir 目录名
     * @returns 文件名列表 (不含目录前缀)
     */
    list(dir: string): Promise<string[]>

    /**
     * 读取目录下所有文件内容
     * @param dir 目录名
     * @returns 所有文件内容的数组
     * @注意 大数据量时可能有性能问题，谨慎使用
     */
    readdir<T>(dir: string): Promise<T[]>

    /**
     * 清空目录
     * @param dir 目录名
     */
    clear(dir: string): Promise<void>

    /**
     * 检查适配器是否可用
     * @returns 如果适配器可正常工作返回 true
     */
    isAvailable(): Promise<boolean>
}
