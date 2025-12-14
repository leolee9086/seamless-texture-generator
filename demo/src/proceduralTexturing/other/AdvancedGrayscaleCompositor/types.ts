/**
 * 高级灰度蒙版合成器参数定义
 */

/**
 * HSL 选区规则 (对应 Shader 中的 HSLRule)
 */
export interface HSLRule {
    id: string; // 前端唯一标识，不传给 GPU
    hue: number;            // 0-360
    hueTolerance: number;   // 0-180
    saturation: number;     // 0-100
    saturationTolerance: number; // 0-100
    lightness: number;      // 0-100
    lightnessTolerance: number; // 0-100
    feather: number;        // 0-1, 边缘羽化
    invert: boolean;        // 是否反选规则
    maskSource: number;     // 0=Self (Layer), 1=Base (Original)
}

/**
 * 混合模式类型
 */
export type BlendMode = 'normal' | 'add' | 'multiply' | 'screen' | 'overlay' | 'max' | 'min' | 'replace';

/**
 * 高级合成器图层定义
 */
export interface CompositorLayer {
    id: string;
    visible: boolean;
    name: string;

    // 图层图片源
    imageSource: string | null; // DataURL 或 图片路径
    imageTexture?: GPUTexture;  // 运行时 GPU 纹理 (不被序列化)

    // 自动分析的色彩调色板 (HSL)
    layerPalette?: { h: number, s: number, l: number }[];

    // Mask 规则列表 (该图层的透明度由这些规则计算得出)
    // 规则之间通常是 OR (Union) 关系，或者加权混合
    maskRules: HSLRule[];

    // 混合设置
    blendMode: BlendMode;
    opacity: number;        // 0-1
}

/**
 * 高级合成器的全局参数
 */
export interface AdvancedCompositorParams {
    layers: CompositorLayer[];

    // 基础底层图片 (Layer 0)
    baseImageSource: string | null;
    baseImageTexture?: GPUTexture;

    outputWidth: number;
    outputHeight: number;
}

/**
 * 单次 Shader 执行参数 (Ping-Pong 每一个 Layer 调用一次)
 */
export interface ExecuteLayerBlendParams {
    device: GPUDevice;
    baseTexture: GPUTexture;  // 当前累积结果 (Input)
    layerTexture: GPUTexture; // 当前图层图片 (Input)
    outputTexture: GPUTexture; // 输出结果 (Output)

    rulesBuffer: GPUBuffer;   // 当前图层的 Mask 规则 Buffer
    ruleCount: number;

    layerOpacity: number;
    layerBlendMode: number;

    originalBaseTexture: GPUTexture; // 原始底图 (用于 Mask 计算)

    width: number;
    height: number;
}

/**
 * GPU HSLRule 结构 (对应 WGSL)
 * size: 32 bytes
 */
/*
struct HSLRule {
    hue: f32,             // offset 0
    hueTolerance: f32,    // offset 4
    saturation: f32,      // offset 8
    saturationTolerance: f32, // offset 12
    
    lightness: f32,       // offset 16
    lightnessTolerance: f32, // offset 20
    feather: f32,         // offset 24
    invert: f32,          // offset 28 (0=false, 1=true)
    maskSource: f32,      // offset 32 (0=Self, 1=Base)
    padding: f32,         // offset 36 (Alignment)
}
*/
export const HSL_RULE_STRUCT_SIZE = 48; // Updated size (aligned to 16 bytes? 32+4+4=40 -> 48 for alignment)
export const MAX_RULES_PER_LAYER = 16;
