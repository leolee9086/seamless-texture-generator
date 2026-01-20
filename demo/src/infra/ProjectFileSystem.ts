/**
 * 项目文件系统服务
 *
 * 提供项目和资产的存储操作，通过适配器接口与底层存储解耦。
 * 支持在运行时切换存储后端（如用户授权 File System Access 后）。
 *
 * @存储结构
 * - projects/{id}: 项目元数据 (JSON)
 * - assets/{id}_original: 原图 (Blob)
 * - assets/{id}_thumb: 缩略图 (Blob)
 */

import type { IFileSystemAdapter } from './adapters/IFileSystemAdapter'
import { IndexDBFSAdapter } from './adapters/IndexDBFSAdapter'
import type { ImageProject } from '../types/project.types'

// ============================================================================
// 常量配置
// ============================================================================

/** 数据库名称 */
const DB_NAME = 'TextureGeneratorProjectsDB'

/** ObjectStore 列表 (目录) */
const STORES = ['projects', 'assets'] as const

/** 数据库版本 */
const DB_VERSION = 1

// ============================================================================
// 项目文件系统服务
// ============================================================================

/**
 * 项目文件系统服务类
 *
 * 通过适配器接口实现与底层存储的解耦
 */
class ProjectFileSystem {
    /** 当前使用的适配器 */
    private adapter: IFileSystemAdapter

    /**
     * 创建项目文件系统服务
     * @param adapter 可选的自定义适配器，默认使用 IndexedDB
     */
    constructor(adapter?: IFileSystemAdapter) {
        // 默认使用 IndexedDB 适配器
        this.adapter = adapter ?? new IndexDBFSAdapter(DB_NAME, [...STORES], DB_VERSION)
    }

    // ========================================================================
    // 适配器管理
    // ========================================================================

    /**
     * 切换到新的适配器
     *
     * 用于运行时切换存储后端（如用户授权 File System Access 后）
     * @param adapter 新的适配器实例
     */
    setAdapter(adapter: IFileSystemAdapter): void {
        this.adapter = adapter
    }

    /**
     * 获取当前适配器名称
     */
    getAdapterName(): string {
        return this.adapter.name
    }

    /**
     * 检查当前适配器是否可用
     */
    async isAvailable(): Promise<boolean> {
        return await this.adapter.isAvailable()
    }

    // ========================================================================
    // 项目元数据操作
    // ========================================================================

    /**
     * 保存项目元数据
     * @param project 项目元数据
     */
    async saveProject(project: ImageProject): Promise<void> {
        await this.adapter.write(`projects/${project.id}`, project)
    }

    /**
     * 读取单个项目元数据
     * @param id 项目 ID
     */
    async loadProject(id: string): Promise<ImageProject | null> {
        return await this.adapter.read<ImageProject>(`projects/${id}`)
    }

    /**
     * 加载所有项目元数据
     * @returns 所有项目的数组
     */
    async loadAllProjects(): Promise<ImageProject[]> {
        return await this.adapter.readdir<ImageProject>('projects')
    }

    /**
     * 删除项目 (含关联资产)
     *
     * 会同时删除：
     * - 项目元数据
     * - 原图
     * - 缩略图
     *
     * @param project 要删除的项目
     */
    async deleteProject(project: ImageProject): Promise<void> {
        // 删除元数据
        await this.adapter.delete(`projects/${project.id}`)

        // 删除关联资产
        // originalPath 格式: assets/{id}_original
        // thumbnailPath 格式: assets/{id}_thumb
        // 适配器 delete 需要的是完整路径 (含目录前缀)
        if (project.originalPath) {
            await this.adapter.delete(project.originalPath).catch(() => {
                // 忽略资产不存在的错误
            })
        }
        if (project.thumbnailPath) {
            await this.adapter.delete(project.thumbnailPath).catch(() => {
                // 忽略资产不存在的错误
            })
        }
    }

    /**
     * 清空所有项目
     */
    async clearAllProjects(): Promise<void> {
        await this.adapter.clear('projects')
        await this.adapter.clear('assets')
    }

    // ========================================================================
    // 资产操作
    // ========================================================================

    /**
     * 保存资产 (原图/缩略图)
     * @param key 资产 key (不含 assets/ 前缀)
     * @param blob 资产数据
     */
    async saveAsset(key: string, blob: Blob): Promise<void> {
        await this.adapter.write(`assets/${key}`, blob)
    }

    /**
     * 加载资产
     * @param key 资产 key (不含 assets/ 前缀)
     * @returns 资产数据，不存在则返回 null
     */
    async loadAsset(key: string): Promise<Blob | null> {
        return await this.adapter.read<Blob>(`assets/${key}`)
    }

    /**
     * 删除资产
     * @param key 资产 key (不含 assets/ 前缀)
     */
    async deleteAsset(key: string): Promise<void> {
        await this.adapter.delete(`assets/${key}`)
    }

    /**
     * 列出所有资产 key
     */
    async listAssets(): Promise<string[]> {
        return await this.adapter.list('assets')
    }
}

// ============================================================================
// 单例导出
// ============================================================================

/**
 * 项目文件系统服务单例
 *
 * 默认使用 IndexedDB 适配器
 */
export const projectFS = new ProjectFileSystem()

// 同时导出类，以便测试或需要多实例的场景
export { ProjectFileSystem }
