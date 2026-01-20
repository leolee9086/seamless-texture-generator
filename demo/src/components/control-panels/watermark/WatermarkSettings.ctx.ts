/**
 * 水印设置工具函数（纯函数库）
 * 提供 IndexedDB 操作的封装，不维护任何状态
 */
import { 保存预设, 获取所有预设, 删除预设 } from './watermark.indexedDB.ctx'
import type { 水印配置, 水印预设 } from './watermark.types'

/** 生成唯一 ID */
export function 生成ID(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 保存指定配置为预设
 * @param 配置 要保存的水印配置
 * @param 名称 预设名称
 */
export async function 保存当前配置(配置: 水印配置, 名称: string): Promise<void> {
    const 新预设: 水印预设 = {
        id: 生成ID(),
        名称,
        配置: { ...配置 },
        创建时间: Date.now()
    }
    await 保存预设(新预设)
}

/**
 * 获取所有预设列表
 */
export async function 获取预设列表(): Promise<水印预设[]> {
    return await 获取所有预设()
}

/**
 * 删除指定预设
 * @param id 预设 ID
 */
export async function 删除指定预设(id: string): Promise<void> {
    await 删除预设(id)
}
