/**
 * 水印设置工具函数（纯函数库）
 * 提供 IndexedDB 操作的封装，不维护任何状态
 */
import { toRaw } from './imports'
import { 保存预设, 获取所有预设, 删除预设 } from './watermark.indexedDB.ctx'
import type { 水印配置, 水印预设, 网格间距配置, 字体信息 } from './watermark.types'
import { normalizeSpacing, isObject, isArray } from './watermark.guard'
import { getAvailableFonts } from './watermark.fonts'

import { PRESET_ID_PREFIX, PRESET_ID_SEPARATOR, TYPE_OBJECT } from './watermark.constants'

/**
 * 生成唯一 ID
 * @简洁函数 ID生成器工具函数
 */
export function 生成ID(): string {
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).slice(2, 8)
    return PRESET_ID_PREFIX + timestamp + PRESET_ID_SEPARATOR + randomPart
}

/**
 * 递归深度解除 Vue 响应式包装
 * @param source 需要解除响应式的源对象
 * @returns 完全解除响应式包装的纯净对象
 */
function deepToRaw(source: unknown): unknown {
    // 获取原始值
    const raw = toRaw(source)
    
    // 处理 null 和非对象类型
    if (raw === null || typeof raw !== TYPE_OBJECT) {
        return raw
    }
    
    // 处理数组
    if (isArray(raw)) {
        return raw.map(item => deepToRaw(item))
    }
    
    // 处理普通对象
    if (isObject(raw)) {
        const result: Record<string, unknown> = {}
        for (const key of Object.keys(raw)) {
            result[key] = deepToRaw(raw[key])
        }
        return result
    }
    
    return raw
}

/**
 * 创建更新行间距的配置对象
 * @简洁函数 配置更新工厂函数
 * @param 当前网格间距 当前的网格间距配置
 * @param 新行间距 新的行间距值
 * @returns 包含更新后网格间距的部分配置对象
 */
export function 创建行间距更新(当前网格间距: number | 网格间距配置, 新行间距: number): Partial<水印配置> {
    const 当前间距 = normalizeSpacing(当前网格间距)
    return { 网格间距: { ...当前间距, 行间距: 新行间距 } }
}

/**
 * 创建更新列间距的配置对象
 * @简洁函数 配置更新工厂函数
 * @param 当前网格间距 当前的网格间距配置
 * @param 新列间距 新的列间距值
 * @returns 包含更新后网格间距的部分配置对象
 */
export function 创建列间距更新(当前网格间距: number | 网格间距配置, 新列间距: number): Partial<水印配置> {
    const 当前间距 = normalizeSpacing(当前网格间距)
    return { 网格间距: { ...当前间距, 列间距: 新列间距 } }
}

/**
 * 保存指定配置为预设
 * @param 配置 要保存的水印配置
 * @param 名称 预设名称
 */
export async function 保存当前配置(配置: 水印配置, 名称: string): Promise<void> {
    // 使用递归深拷贝彻底解除所有 Proxy
    const 纯净配置 = deepToRaw(配置)
    // 再用 JSON 序列化确保完全是纯数据
    const 最终配置 = JSON.parse(JSON.stringify(纯净配置))
    
    const 新预设: 水印预设 = {
        id: 生成ID(),
        名称,
        配置: 最终配置,
        创建时间: Date.now()
    }
    await 保存预设(新预设)
}

/**
 * 获取所有预设列表
 * @简洁函数 IndexedDB 操作封装
 */
export async function 获取预设列表(): Promise<水印预设[]> {
    return await 获取所有预设()
}

/**
 * 删除指定预设
 * @简洁函数 IndexedDB 操作封装
 * @param id 预设 ID
 */
export async function 删除指定预设(id: string): Promise<void> {
    await 删除预设(id)
}

/**
 * 加载可用字体列表
 * 优先使用系统字体，降级到安全字体列表
 * @简洁函数 字体服务封装函数
 * @returns 可用字体列表
 */
export async function 加载字体列表(): Promise<字体信息[]> {
    return await getAvailableFonts()
}
