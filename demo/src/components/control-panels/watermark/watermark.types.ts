/**
 * 水印功能类型定义
 */

/** 水印样式 */
export type 水印样式 = 'grid' | 'center'

/** 字体信息 */
export interface 字体信息 {
    family: string      // 字体族名称
    fullName: string    // 完整显示名称
    style?: string      // 字体样式（Regular, Bold 等）
}

/** Local Font Access API 字体数据接口 */
export interface FontData {
    family: string
    fullName: string
    style: string
    postscriptName: string
}

/** 查询本地字体的函数类型 */
export type QueryLocalFontsFunction = () => Promise<FontData[]>


/** 网格间距配置 */
export interface 网格间距配置 {
    行间距: number
    列间距: number
}

/** 文本样式配置 */
export interface 文本样式配置 {
    字重: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold'
    斜体: boolean
    描边宽度: number    // 0 表示无描边
    描边颜色: string
}

/** 水印配置 */
export interface 水印配置 {
    样式: 水印样式
    文本: string
    字体大小: number
    字体: string        // 字体族名称
    不透明度: number
    网格间距: 网格间距配置 // 仅 grid 样式有效
    旋转角度: number // 旋转角度（度），范围 0-360
    颜色: string
    文本样式?: 文本样式配置  // 新增：可选的高级文本样式
}

/** 旧版水印配置（用于迁移兼容） */
export interface 旧版水印配置 {
    样式: 水印样式
    文本: string
    字体大小: number
    不透明度: number
    网格间距: number // 旧版为单一数值
    颜色: string
}

/** 水印预设 */
export interface 水印预设 {
    id: string
    名称: string
    配置: 水印配置
    创建时间: number
}

/** 预设元数据（用于 IndexedDB 列表管理） */
export interface 预设列表元数据 {
    id: string
    预设IDs: string[]
}

/** 水印渲染上下文 */
export interface 水印渲染上下文 {
    ctx: CanvasRenderingContext2D
    width: number
    height: number
    config: 水印配置
}

/** 滑块项配置类型 */
export type SliderItemConfig = {
    id: string
    label: string
    value: number
    min: number
    max: number
    step: number
    valuePosition: 'after'
    showRuler: false
}

/** 滑块处理器类型 */
export type SliderHandler = (value: number) => void
