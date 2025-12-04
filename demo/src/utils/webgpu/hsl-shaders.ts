/**
 * HSL颜色调整WebGPU计算着色器
 * 基于参考实现的GPU加速版本
 */

/**
 * HSL选择性颜色调整着色器模板
 * 支持可配置的工作组大小
 */
export const hslComputeShaderTemplate = (workgroupSizeX: number, workgroupSizeY: number) => `
struct HSLParams {
    // 目标颜色HSL值
    targetHue: f32,        // 目标色相 (0-1)
    targetSaturation: f32, // 目标饱和度 (0-1)
    
    // 调整参数
    hueOffset: f32,        // 色相偏移 (-0.5 to 0.5, 对应-180°到180°)
    saturationOffset: f32, // 饱和度偏移 (-1 to 1)
    lightnessOffset: f32,  // 明度偏移 (-1 to 1)
    
    // 遮罩控制参数
    tolerance: f32,        // 容差 (0-100), 控制选择范围
    range: f32,            // 羽化范围 (0-100), 控制边缘柔和度
    
    // 遮罩输出控制
    enableMask: f32,       // 是否启用遮罩 (0.0 = 禁用, 1.0 = 启用)
    maskMode: f32,         // 遮罩模式 (0 = 调整颜色, 1 = 输出遮罩, 2 = 输出叠加)
    
    // 遮罩叠加参数
    overlayColor: vec3<f32>, // 叠加颜色 (RGB)
    overlayAlpha: f32,       // 叠加透明度 (0-1)
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;                    // 输入图像纹理
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>; // 输出图像纹理
@group(0) @binding(2) var<uniform> params: HSLParams;                        // Uniform参数

// RGB到HSL转换函数
fn rgbToHsl(rgb: vec3<f32>) -> vec3<f32> {
    let r = rgb.r;
    let g = rgb.g;
    let b = rgb.b;
    
    let maxVal = max(max(r, g), b);
    let minVal = min(min(r, g), b);
    let l = (maxVal + minVal) * 0.5;
    
    var h = 0.0;
    var s = 0.0;
    
    if (maxVal != minVal) {
        let d = maxVal - minVal;
        s = select(d / (2.0 - maxVal - minVal), d / (maxVal + minVal), l > 0.5);
        
        if (maxVal == r) {
            h = (g - b) / d + select(6.0, 0.0, g >= b);
        } else if (maxVal == g) {
            h = (b - r) / d + 2.0;
        } else {
            h = (r - g) / d + 4.0;
        }
        h = h / 6.0;
    }
    
    return vec3<f32>(h, s, l);
}

// HSL到RGB转换函数
fn hslToRgb(hsl: vec3<f32>) -> vec3<f32> {
    let h = hsl.x;
    let s = hsl.y;
    let l = hsl.z;
    
    var r = 0.0;
    var g = 0.0;
    var b = 0.0;
    
    if (s == 0.0) {
        // 灰色
        r = l;
        g = l;
        b = l;
    } else {
        let q = select(l * (1.0 + s), l + s - l * s, l < 0.5);
        let p = 2.0 * l - q;
        
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
    }
    
    return vec3<f32>(r, g, b);
}

// HSL色相辅助函数
fn hue2rgb(p: f32, q: f32, t: f32) -> f32 {
    var tAdjusted = t;
    if (tAdjusted < 0.0) { tAdjusted = tAdjusted + 1.0; }
    if (tAdjusted > 1.0) { tAdjusted = tAdjusted - 1.0; }
    
    if (tAdjusted < 1.0 / 6.0) {
        return p + (q - p) * 6.0 * tAdjusted;
    } else if (tAdjusted < 1.0 / 2.0) {
        return q;
    } else if (tAdjusted < 2.0 / 3.0) {
        return p + (q - p) * (2.0 / 3.0 - tAdjusted) * 6.0;
    } else {
        return p;
    }
}

// 计算色相差异（考虑色相的循环性质）
fn hueDifference(h1: f32, h2: f32) -> f32 {
    let diff = abs(h1 - h2);
    return min(diff, 1.0 - diff);
}

// 应用羽化效果
fn applyFeathering(weight: f32, featherFactor: f32) -> f32 {
    if (featherFactor == 0.0) {
        // 无羽化 - 使用smoothstep实现硬边缘
        return weight * weight * (3.0 - 2.0 * weight);
    } else if (featherFactor == 1.0) {
        // 最大羽化 - 非常柔和的边缘
        return weight;
    } else {
        // 在硬边缘和软边缘之间插值
        let hardEdge = weight * weight * (3.0 - 2.0 * weight);
        let softEdge = weight;
        return hardEdge * (1.0 - featherFactor) + softEdge * featherFactor;
    }
}

// 计算遮罩权重
fn calculateMaskWeight(pixelH: f32, pixelS: f32, targetH: f32, targetS: f32, tolerance: f32, range: f32) -> f32 {
    // 容差越小，选择范围越小
    // 使用反向映射：tolerance 100 -> tolerance 0.05, tolerance 0 -> tolerance 0.5
    let hueTolerance = 0.5 - (tolerance / 100.0) * 0.45;
    let satTolerance = 1.0 - (tolerance / 100.0) * 0.9;

    let hueDiff = hueDifference(pixelH, targetH);
    let satDiff = abs(pixelS - targetS);

    var hueWeight = 0.0;
    if (hueTolerance > 0.0) {
        hueWeight = max(0.0, 1.0 - (hueDiff / hueTolerance));
    } else {
        hueWeight = select(0.0, 1.0, hueDiff < 0.01);
    }

    var satWeight = 0.0;
    if (satTolerance > 0.0) {
        satWeight = max(0.0, 1.0 - (satDiff / satTolerance));
    } else {
        satWeight = select(0.0, 1.0, satDiff < 0.01);
    }

    let weight = min(hueWeight, satWeight);
    
    // 应用羽化效果：范围值越小，边缘越硬；范围值越大，边缘越软
    let featherFactor = range / 100.0;
    let featheredWeight = applyFeathering(weight, featherFactor);
    
    return featheredWeight;
}

// 主计算函数
@compute @workgroup_size(${workgroupSizeX}, ${workgroupSizeY})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(inputTexture);
    let coords = vec2<u32>(global_id.xy);

    // 边界检查
    if (coords.x >= dims.x || coords.y >= dims.y) {
        return;
    }

    // 加载原始像素颜色
    let originalColor = textureLoad(inputTexture, vec2<i32>(i32(coords.x), i32(coords.y)), 0);
    
    // 转换为HSL
    let hsl = rgbToHsl(originalColor.rgb);
    
    // 计算遮罩权重
    let maskWeight = calculateMaskWeight(
        hsl.x, hsl.y, 
        params.targetHue, params.targetSaturation, 
        params.tolerance, params.range
    );

    var finalColor = originalColor;
    
    if (params.maskMode == 0.0) {
        // 模式0: 调整颜色
        if (maskWeight > 0.0) {
            var newH = hsl.x + (params.hueOffset * maskWeight);
            newH = fract(newH); // 确保色相在0-1范围内

            let newS = clamp(hsl.y + (params.saturationOffset * maskWeight), 0.0, 1.0);
            let newL = clamp(hsl.z + (params.lightnessOffset * maskWeight), 0.0, 1.0);

            let adjustedRgb = hslToRgb(vec3<f32>(newH, newS, newL));
            
            // 根据权重混合原始颜色和调整后的颜色
            finalColor = vec4<f32>(
                mix(originalColor.rgb, adjustedRgb, maskWeight),
                originalColor.a
            );
        }
    } else if (params.maskMode == 1.0) {
        // 模式1: 输出遮罩可视化
        let maskValue = maskWeight;
        finalColor = vec4<f32>(maskValue, maskValue, maskValue, originalColor.a);
    } else if (params.maskMode == 2.0) {
        // 模式2: 输出叠加效果
        let alpha = maskWeight * params.overlayAlpha;
        finalColor = vec4<f32>(
            mix(originalColor.rgb, params.overlayColor, alpha),
            originalColor.a
        );
    }

    // 写入输出纹理
    textureStore(outputTexture, coords, finalColor);
}
`;

/**
 * 标准HSL处理着色器（使用16x16工作组）
 * 适用于大多数WebGPU实现
 */
export const hslComputeShader = hslComputeShaderTemplate(16, 16);

/**
 * 高性能HSL处理着色器（使用32x32工作组）
 * 适用于支持更大工作组的现代GPU
 */
export const hslComputeShaderHighPerformance = hslComputeShaderTemplate(32, 32);

/**
 * 全局HSL调整着色器模板（无遮罩）
 * 直接对所有像素应用HSL调整，不进行颜色选择
 */
export const globalHSLComputeShaderTemplate = (workgroupSizeX: number, workgroupSizeY: number) => `
struct GlobalHSLParams {
    // 全局HSL调整参数
    hueOffset: f32,        // 色相偏移 (-0.5 to 0.5, 对应-180°到180°)
    saturationOffset: f32, // 饱和度偏移 (-1 to 1)
    lightnessOffset: f32,  // 明度偏移 (-1 to 1)
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;                    // 输入图像纹理
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>; // 输出图像纹理
@group(0) @binding(2) var<uniform> params: GlobalHSLParams;                   // Uniform参数

// RGB到HSL转换函数
fn rgbToHsl(rgb: vec3<f32>) -> vec3<f32> {
    let r = rgb.r;
    let g = rgb.g;
    let b = rgb.b;
    
    let maxVal = max(max(r, g), b);
    let minVal = min(min(r, g), b);
    let l = (maxVal + minVal) * 0.5;
    
    var h = 0.0;
    var s = 0.0;
    
    if (maxVal != minVal) {
        let d = maxVal - minVal;
        s = select(d / (2.0 - maxVal - minVal), d / (maxVal + minVal), l > 0.5);
        
        if (maxVal == r) {
            h = (g - b) / d + select(6.0, 0.0, g >= b);
        } else if (maxVal == g) {
            h = (b - r) / d + 2.0;
        } else {
            h = (r - g) / d + 4.0;
        }
        h = h / 6.0;
    }
    
    return vec3<f32>(h, s, l);
}

// HSL到RGB转换函数
fn hslToRgb(hsl: vec3<f32>) -> vec3<f32> {
    let h = hsl.x;
    let s = hsl.y;
    let l = hsl.z;
    
    var r = 0.0;
    var g = 0.0;
    var b = 0.0;
    
    if (s == 0.0) {
        // 灰色
        r = l;
        g = l;
        b = l;
    } else {
        let q = select(l * (1.0 + s), l + s - l * s, l < 0.5);
        let p = 2.0 * l - q;
        
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
    }
    
    return vec3<f32>(r, g, b);
}

// HSL色相辅助函数
fn hue2rgb(p: f32, q: f32, t: f32) -> f32 {
    var tAdjusted = t;
    if (tAdjusted < 0.0) { tAdjusted = tAdjusted + 1.0; }
    if (tAdjusted > 1.0) { tAdjusted = tAdjusted - 1.0; }
    
    if (tAdjusted < 1.0 / 6.0) {
        return p + (q - p) * 6.0 * tAdjusted;
    } else if (tAdjusted < 1.0 / 2.0) {
        return q;
    } else if (tAdjusted < 2.0 / 3.0) {
        return p + (q - p) * (2.0 / 3.0 - tAdjusted) * 6.0;
    } else {
        return p;
    }
}

// 主计算函数
@compute @workgroup_size(${workgroupSizeX}, ${workgroupSizeY})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(inputTexture);
    let coords = vec2<u32>(global_id.xy);

    // 边界检查
    if (coords.x >= dims.x || coords.y >= dims.y) {
        return;
    }

    // 加载原始像素颜色
    let originalColor = textureLoad(inputTexture, vec2<i32>(i32(coords.x), i32(coords.y)), 0);
    
    // 转换为HSL
    let hsl = rgbToHsl(originalColor.rgb);
    
    // 应用全局HSL调整
    var newH = hsl.x + params.hueOffset;
    newH = fract(newH); // 确保色相在0-1范围内

    let newS = clamp(hsl.y + params.saturationOffset, 0.0, 1.0);
    let newL = clamp(hsl.z + params.lightnessOffset, 0.0, 1.0);

    let adjustedRgb = hslToRgb(vec3<f32>(newH, newS, newL));
    
    // 输出调整后的颜色
    let finalColor = vec4<f32>(adjustedRgb, originalColor.a);

    // 写入输出纹理
    textureStore(outputTexture, coords, finalColor);
}
`;

/**
 * 标准全局HSL处理着色器（使用16x16工作组）
 * 适用于大多数WebGPU实现
 */
export const globalHSLComputeShader = globalHSLComputeShaderTemplate(16, 16);

/**
 * 高性能全局HSL处理着色器（使用32x32工作组）
 * 适用于支持更大工作组的现代GPU
 */
export const globalHSLComputeShaderHighPerformance = globalHSLComputeShaderTemplate(32, 32);

/**
 * 创建HSL计算着色器模块
 * @param device WebGPU设备
 * @param highPerformance 是否使用高性能模式
 * @returns 着色器模块
 */
export function createHSLComputeShader(device: GPUDevice, highPerformance: boolean = false): GPUShaderModule {
    const shaderCode = highPerformance ? hslComputeShaderHighPerformance : hslComputeShader;
    return device.createShaderModule({
        code: shaderCode,
        label: highPerformance ? 'HSL Compute Shader (High Performance)' : 'HSL Compute Shader (Optimized)'
    });
}

/**
 * 创建全局HSL计算着色器模块（无遮罩）
 * @param device WebGPU设备
 * @param highPerformance 是否使用高性能模式
 * @returns 着色器模块
 */
export function createGlobalHSLComputeShader(device: GPUDevice, highPerformance: boolean = false): GPUShaderModule {
    const shaderCode = highPerformance ? globalHSLComputeShaderHighPerformance : globalHSLComputeShader;
    return device.createShaderModule({
        code: shaderCode,
        label: highPerformance ? 'Global HSL Compute Shader (High Performance)' : 'Global HSL Compute Shader (Optimized)'
    });
}

/**
 * HSL参数工厂函数
 * 用于创建符合着色器要求的参数结构
 */
export interface HSLAdjustmentParams {
    targetColor: string;    // 目标颜色（十六进制）
    hueOffset: number;      // 色相偏移（度）
    saturationOffset: number; // 饱和度偏移（百分比）
    lightnessOffset: number;  // 明度偏移（百分比）
    precision: number;       // 精确度（0-100）
    range: number;          // 羽化范围（0-100）
    maskMode: 'adjust' | 'mask' | 'overlay' | 'none'; // 遮罩模式
    overlayColor?: [number, number, number]; // 叠加颜色（RGB）
    overlayAlpha?: number;  // 叠加透明度
}

/**
 * 将十六进制颜色转换为HSL
 */
export function hexToHsl(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];

    const r = parseInt(result[1] ?? '0', 16) / 255;
    const g = parseInt(result[2] ?? '0', 16) / 255;
    const b = parseInt(result[3] ?? '0', 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [h, s, l];
}

/**
 * 创建HSL参数缓冲区数据
 */
export function createHSLParams(params: HSLAdjustmentParams): Float32Array {
    const [targetH, targetS] = hexToHsl(params.targetColor);

    const maskModeValue = params.maskMode === 'adjust' ? 0 :
        params.maskMode === 'mask' ? 1 : 2;

    const overlayColor = params.overlayColor || [1.0, 0.0, 0.0]; // 默认红色
    const overlayAlpha = params.overlayAlpha ?? 0.6; // 默认60%透明度

    // 创建16个元素的数组以满足16字节对齐要求
    const data = new Float32Array(16)

    // 填充实际的13个参数值
    data[0] = targetH                    // targetHue (Offset 0)
    data[1] = targetS                    // targetSaturation (Offset 4)
    data[2] = params.hueOffset / 360     // hueOffset (Offset 8)
    data[3] = params.saturationOffset / 100 // saturationOffset (Offset 12)
    data[4] = params.lightnessOffset / 100  // lightnessOffset (Offset 16)
    data[5] = params.precision           // precision (Offset 20)
    data[6] = params.range               // range (Offset 24)
    data[7] = params.maskMode === 'none' ? 0 : 1 // enableMask (Offset 28)
    data[8] = maskModeValue              // maskMode (Offset 32)

    // Padding (Offset 36-48) - 3 floats (12 bytes) to align vec3 to 16 bytes
    data[9] = 0
    data[10] = 0
    data[11] = 0

    data[12] = overlayColor[0]           // overlayColor.r (Offset 48)
    data[13] = overlayColor[1]           // overlayColor.g (Offset 52)
    data[14] = overlayColor[2]           // overlayColor.b (Offset 56)
    data[15] = overlayAlpha              // overlayAlpha (Offset 60)

    return data
}

/**
 * 全局HSL调整参数接口
 */
export interface GlobalHSLAdjustmentParams {
    hueOffset: number;      // 色相偏移（度）
    saturationOffset: number; // 饱和度偏移（百分比）
    lightnessOffset: number;  // 明度偏移（百分比）
}

/**
 * 创建全局HSL参数缓冲区数据
 */
export function createGlobalHSLParams(params: GlobalHSLAdjustmentParams): Float32Array {
    // 创建4个元素的数组以满足16字节对齐要求
    const data = new Float32Array(4)

    // 填充实际的3个参数值
    data[0] = params.hueOffset / 360     // hueOffset (Offset 0)
    data[1] = params.saturationOffset / 100 // saturationOffset (Offset 4)
    data[2] = params.lightnessOffset / 100  // lightnessOffset (Offset 8)
    data[3] = 0.0 // Padding (Offset 12)

    return data
}
