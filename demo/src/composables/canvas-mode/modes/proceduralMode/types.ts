/**
 * 程序化纹理模式 - 类型定义
 */

import type { CanvasMode } from '../../types'

/**
 * 程序化纹理生成器接口
 */
export interface ProceduralTextureGenerator {
    /** 生成纹理 */
    generate(params: unknown, width: number, height: number): Promise<string>
    /** 获取默认参数 */
    getDefaultParams(): unknown
}

/**
 * 程序化纹理模式实例接口
 * 扩展 CanvasMode 接口，添加程序化纹理模式特有的方法
 */
export interface ProceduralModeInstance extends CanvasMode {
    /** 更新程序化纹理参数并重新生成 */
    updateTexture(params: unknown, width: number, height: number): Promise<void>
    /** 获取当前生成的纹理 */
    getCurrentTexture(): string | null
    /** 设置当前生成的纹理（由外部生成器调用） */
    setCurrentTexture(dataUrl: string | null): void
    /** 输出版本号（用于触发响应式更新） */
    readonly outputVersion: { value: number }
}
