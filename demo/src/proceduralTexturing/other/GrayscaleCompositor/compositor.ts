/**
 * 灰度蒙版合成器参数
 * 用于基于灰度蒙版将两个图片进行精细混合
 */
export interface GrayscaleCompositorParams {
    // 蒙版控制参数
    threshold: number;          // 蒙版阈值 0.0 - 1.0
    softness: number;           // 边缘柔和度 0.0 - 1.0
    contrast: number;           // 蒙版对比度 0.0 - 2.0
    invert: boolean;            // 是否反转蒙版

    // 混合控制参数
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
    opacity: number;            // 整体不透明度 0.0 - 1.0

    // 色彩调整参数
    maskBias: number;           // 蒙版偏移 -1.0 - 1.0
    maskGamma: number;          // 蒙版Gamma校正 0.1 - 3.0
}

export const grayscaleCompositorWGSL = /* wgsl */`
// ==========================================
// 辅助函数
// ==========================================

// 将线性RGB转换为sRGB
fn linearToSRGB(linear: vec3<f32>) -> vec3<f32> {
    return select(
        1.055 * pow(linear, vec3<f32>(1.0/2.4)) - 0.055,
        12.92 * linear,
        linear <= vec3<f32>(0.0031308)
    );
}

// 将sRGB转换为线性RGB
fn sRGBToLinear(srgb: vec3<f32>) -> vec3<f32> {
    return select(
        pow((srgb + 0.055) / 1.055, vec3<f32>(2.4)),
        srgb / 12.92,
        srgb <= vec3<f32>(0.04045)
    );
}

// Smoothstep函数，用于柔和过渡
fn smoothstep(edge0: f32, edge1: f32, x: f32) -> f32 {
    let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// ==========================================
// 混合模式
// ==========================================

fn blendNormal(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return blend;
}

fn blendMultiply(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return base * blend;
}

fn blendScreen(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

fn blendOverlay(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return select(
        2.0 * base * blend,
        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
        base > vec3<f32>(0.5)
    );
}

// ==========================================
// Compute Shader: 灰度蒙版合成
// ==========================================

struct CompositorParams {
    threshold: f32,
    softness: f32,
    contrast: f32,
    invertMask: f32,     // 0.0 or 1.0
    
    blendMode: f32,      // 0=normal, 1=multiply, 2=screen, 3=overlay
    opacity: f32,
    maskBias: f32,
    maskGamma: f32,
    
    padding1: f32,
    padding2: f32,
    padding3: f32,
    padding4: f32
};

@group(0) @binding(0) var<uniform> params: CompositorParams;
@group(0) @binding(1) var imageA: texture_2d<f32>;      // 图片A
@group(0) @binding(2) var imageB: texture_2d<f32>;      // 图片B
@group(0) @binding(3) var maskTex: texture_2d<f32>;     // 灰度蒙版
@group(0) @binding(4) var outputTex: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) {
    let dims = textureDimensions(imageA);
    let coords = vec2<i32>(id.xy);
    
    if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) { return; }
    
    // 读取三个纹理
    let colorA = textureLoad(imageA, coords, 0).rgb;
    let colorB = textureLoad(imageB, coords, 0).rgb;
    var maskValue = textureLoad(maskTex, coords, 0).r; // 使用R通道
    
    // --- 蒙版处理 ---
    
    // 1. 应用偏移
    maskValue = clamp(maskValue + params.maskBias, 0.0, 1.0);
    
    // 2. 应用Gamma校正
    maskValue = pow(maskValue, params.maskGamma);
    
    // 3. 应用对比度增强
    // 使用中心点为0.5的对比度调整
    maskValue = clamp((maskValue - 0.5) * params.contrast + 0.5, 0.0, 1.0);
    
    // 4. 应用阈值和柔和度
    let edge0 = clamp(params.threshold - params.softness * 0.5, 0.0, 1.0);
    let edge1 = clamp(params.threshold + params.softness * 0.5, 0.0, 1.0);
    maskValue = smoothstep(edge0, edge1, maskValue);
    
    // 5. 反转蒙版（如果需要）
    if (params.invertMask > 0.5) {
        maskValue = 1.0 - maskValue;
    }
    
    // --- 颜色混合 ---
    
    // 转换到线性空间进行混合
    let linearA = sRGBToLinear(colorA);
    let linearB = sRGBToLinear(colorB);
    
    // 根据混合模式选择混合方法
    var blendedColor = linearB;
    if (params.blendMode < 0.5) {
        blendedColor = blendNormal(linearA, linearB);
    } else if (params.blendMode < 1.5) {
        blendedColor = blendMultiply(linearA, linearB);
    } else if (params.blendMode < 2.5) {
        blendedColor = blendScreen(linearA, linearB);
    } else {
        blendedColor = blendOverlay(linearA, linearB);
    }
    
    // 使用蒙版混合两个图片
    var finalColor = mix(linearA, blendedColor, maskValue * params.opacity);
    
    // 转换回sRGB空间
    finalColor = linearToSRGB(finalColor);
    
    // 输出最终颜色
    textureStore(outputTex, coords, vec4<f32>(finalColor, 1.0));
}

// ==========================================
// 渲染着色器：用于预览蒙版
// ==========================================

struct PreviewUniforms {
    showMask: f32,       // 0=合成结果, 1=蒙版预览
    padding1: f32,
    padding2: f32,
    padding3: f32
};

@group(0) @binding(0) var<uniform> preview: PreviewUniforms;
@group(0) @binding(1) var resultTex: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;

struct VertexOutput {
    @builtin(position) Pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@location(0) pos: vec3<f32>, @location(1) uv: vec2<f32>) -> VertexOutput {
    var out: VertexOutput;
    out.Pos = vec4<f32>(pos, 1.0);
    out.uv = uv;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let color = textureSample(resultTex, smp, in.uv);
    return color;
}
`;
