/**
 * 清晰度调整 WGSL 着色器代码
 */

/** 清晰度合成着色器 - 用于细节增强和宏观增强的混合 */
export const 清晰度合成着色器 = /* wgsl */`
    struct CompositionParams {
        detailStrength: f32,
        enhancementStrength: f32,
        macroEnhancement: f32,
        contrastBoost: f32,
        padding1: vec4<f32>,
        padding2: vec4<f32>
    }

    @group(0) @binding(0) var originalTexture: texture_2d<f32>;
    @group(0) @binding(1) var baseTexture: texture_2d<f32>;
    @group(0) @binding(2) var detailTexture: texture_2d<f32>;
    @group(0) @binding(3) var outputTexture: texture_storage_2d<rgba32float, write>;
    @group(0) @binding(4) var<uniform> params: CompositionParams;

    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let coord = vec2<i32>(global_id.xy);
        let dims = textureDimensions(originalTexture);
        
        if (coord.x >= i32(dims.x) || coord.y >= i32(dims.y)) {
            return;
        }
        
        // 采样纹理
        let original = textureLoad(originalTexture, coord, 0);
        let base = textureLoad(baseTexture, coord, 0);
        let detail = textureLoad(detailTexture, coord, 0);
        
        // 计算亮度
        let originalLum = dot(original.rgb, vec3<f32>(0.299, 0.587, 0.114));
        let baseLum = dot(base.rgb, vec3<f32>(0.299, 0.587, 0.114));
        
        // 计算偏差
        let brightnessDiff = abs(originalLum - baseLum);
        let contrastFactor = 1.0 - brightnessDiff * 0.7;
        
        // 智能强度调节（降低过度增强）
        let smartStrength = params.detailStrength * contrastFactor * 0.7;
        
        // 宏观增强
        let meanLum = baseLum;
        // 计算宏观增强（独立控制）
        var macroBase = base.rgb * params.contrastBoost;
        macroBase = clamp(macroBase, vec3<f32>(0.0), vec3<f32>(1.0));
        
        // 计算细节增强（限制增强幅度）
        let detailEnhanced = original.rgb + detail.rgb * smartStrength;
        
        // 混合宏观增强（增加权重影响）
        let macroWeight = params.macroEnhancement * 0.8; // 增强宏观效果
        let macroEnhanced = mix(detailEnhanced, macroBase, macroWeight);
        
        // 最终增强：使用加权混合而非乘法放大，增加对比度控制
        let contrastAdjusted = mix(original.rgb, macroEnhanced, params.enhancementStrength);
        
        // 应用对比度增强
        let meanValue = dot(contrastAdjusted, vec3<f32>(0.299, 0.587, 0.114));
        let contrastEnhanced = meanValue + (contrastAdjusted - meanValue) * (1.0 + params.contrastBoost * 0.5);
        
        var enhanced = clamp(contrastEnhanced, vec3<f32>(0.0), vec3<f32>(1.0));
        
        // 写入结果
        textureStore(outputTexture, coord, vec4<f32>(enhanced, original.a));
    }
`

// 英文别名
export const CLARITY_COMPOSITION_SHADER = 清晰度合成着色器
