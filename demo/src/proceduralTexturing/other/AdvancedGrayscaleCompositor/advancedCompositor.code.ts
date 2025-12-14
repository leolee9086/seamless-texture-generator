/**
 * 高级灰度蒙版合成器的 WGSL 着色器代码 (Single Pass Layer Blender)
 */
export const advancedCompositorWGSL = /* wgsl */`

// ==========================================
// 结构定义
// ==========================================

struct HSLRule {
    hue: f32,             // offset 0
    hueTolerance: f32,    // offset 4
    saturation: f32,      // offset 8
    saturationTolerance: f32, // offset 12
    
    lightness: f32,       // offset 16
    lightnessTolerance: f32, // offset 20
    feather: f32,         // offset 24
    invert: f32,          // offset 28
};

struct LayerParams {
    ruleCount: f32,
    opacity: f32,
    blendMode: f32,      // 0=normal, 1=add, 2=multiply, 3=screen, 4=overlay, 5=max, 6=min
    padding: f32
};

@group(0) @binding(0) var baseTexture: texture_2d<f32>;      // Base (Current Result)
@group(0) @binding(1) var layerTexture: texture_2d<f32>;     // Layer Image
@group(0) @binding(2) var dstTexture: texture_storage_2d<rgba8unorm, write>; // Output
@group(0) @binding(3) var<storage, read> rules: array<HSLRule>; // Mask Rules
@group(0) @binding(4) var<uniform> params: LayerParams;

// ==========================================
// 辅助函数: 色彩空间转换
// ==========================================

fn rgbToHsl(c: vec3<f32>) -> vec3<f32> {
    let maxVal = max(max(c.r, c.g), c.b);
    let minVal = min(min(c.r, c.g), c.b);
    let delta = maxVal - minVal;

    var h: f32 = 0.0;
    var s: f32 = 0.0;
    let l = (maxVal + minVal) / 2.0;

    if (delta > 0.00001) {
        if (l < 0.5) {
            s = delta / (maxVal + minVal);
        } else {
            s = delta / (2.0 - maxVal - minVal);
        }

        if (c.r == maxVal) {
            h = (c.g - c.b) / delta;
            if (c.g < c.b) {
                h = h + 6.0;
            }
        } else if (c.g == maxVal) {
            h = (c.b - c.r) / delta + 2.0;
        } else {
            h = (c.r - c.g) / delta + 4.0;
        }
        h = h * 60.0;
    }

    // 归一化 S 和 L 到 0-100, H 保持 0-360
    return vec3<f32>(h, s * 100.0, l * 100.0);
}

// ==========================================
// 蒙版计算
// ==========================================

fn calculateHueDistance(h1: f32, h2: f32, tolerance: f32) -> f32 {
    let diff = abs(h1 - h2);
    let shortestDiff = min(diff, 360.0 - diff);
    return min(1.0, shortestDiff / max(0.01, tolerance));
}

fn calculateRuleMask(pixelHsl: vec3<f32>, rule: HSLRule) -> f32 {
    let hueDist = calculateHueDistance(pixelHsl.x, rule.hue, rule.hueTolerance);
    let satDist = abs(pixelHsl.y - rule.saturation) / max(0.01, rule.saturationTolerance);
    let lightDist = abs(pixelHsl.z - rule.lightness) / max(0.01, rule.lightnessTolerance);

    let totalDist = sqrt(hueDist * hueDist + satDist * satDist + lightDist * lightDist);
    
    let featherFactor = max(0.01, rule.feather);
    let mask = (1.0 - totalDist) * (1.0 - featherFactor) + featherFactor * exp(-totalDist * 2.0);
    
    var finalVal = clamp(mask, 0.0, 1.0);
    
    if (rule.invert > 0.5) {
        finalVal = 1.0 - finalVal;
    }
    return finalVal;
}

// ==========================================
// 混合模式
// ==========================================

fn blendNormal(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return blend;
}

fn blendAdd(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return min(base + blend, vec3<f32>(1.0));
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

fn blendMax(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return max(base, blend);
}

fn blendMin(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32> {
    return min(base, blend);
}

// ==========================================
// Compute Shader Main
// ==========================================

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) {
    let dims = textureDimensions(baseTexture);
    if (id.x >= dims.x || id.y >= dims.y) {
        return;
    }
    let coords = vec2<i32>(id.xy);

    // 1. 读取基础颜色 (Base) 和当前图层颜色 (Layer)
    let baseColor = textureLoad(baseTexture, coords, 0).rgb;
    let layerColor = textureLoad(layerTexture, coords, 0).rgb;
    
    // 2. 计算 Layer Mask
    // 将 Layer 颜色转为 HSL 进行判断
    let layerHsl = rgbToHsl(layerColor);
    
    var computedAlpha: f32 = 0.0;
    let count = i32(params.ruleCount);
    
    // 如果没有规则，默认全透(0)还是全显(1)? 
    // 根据需求 "选择HSL蒙版计算器"，隐含意图是选取部分区域。
    // 这里设定：若无规则，则透明度为1 (整张图叠加)，或者0?
    // 通常逻辑是：规则定义了“可见区域”。所以初始为0。
    // 但是如果规则列表为空呢？
    // 假设空规则列表意味着该图层不受HSL限制，直接使用全局透明度。
    if (count == 0) {
        computedAlpha = 1.0;
    } else {
        // 规则之间取最大值 (Union)
        for (var i = 0; i < count; i = i + 1) {
            let rule = rules[i];
            let val = calculateRuleMask(layerHsl, rule);
            computedAlpha = max(computedAlpha, val);
        }
    }
    
    // 应用图层全局透明度
    computedAlpha = computedAlpha * params.opacity;

    // 3. 混合
    var blendedResult = layerColor;
    let mode = i32(params.blendMode);
    
    if (mode == 0) { blendedResult = blendNormal(baseColor, layerColor); }
    else if (mode == 1) { blendedResult = blendAdd(baseColor, layerColor); }
    else if (mode == 2) { blendedResult = blendMultiply(baseColor, layerColor); }
    else if (mode == 3) { blendedResult = blendScreen(baseColor, layerColor); }
    else if (mode == 4) { blendedResult = blendOverlay(baseColor, layerColor); }
    else if (mode == 5) { blendedResult = blendMax(baseColor, layerColor); }
    else if (mode == 6) { blendedResult = blendMin(baseColor, layerColor); }
    
    // 最终颜色 = mix(Base, Blended, Alpha)
    let finalColor = mix(baseColor, blendedResult, computedAlpha);
    
    textureStore(dstTexture, coords, vec4<f32>(finalColor, 1.0));
}
`;
