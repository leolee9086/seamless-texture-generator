/**
 * 木纹渲染器 - 节点化计算着色器
 * 每个节点都是独立的计算管线，输出GPUBuffer
 */

// ============================================================
// 共享代码：噪声函数（所有节点共用）
// ============================================================

export const noiseCommonWGSL = /* wgsl */`
// 周期性伪随机哈希
fn hash3_periodic(p: vec3<f32>, period: vec3<f32>) -> vec3<f32> {
    let wrappedP = p % period; 
    
    var q = vec3<f32>(dot(wrappedP, vec3<f32>(127.1, 311.7, 74.7)),
                      dot(wrappedP, vec3<f32>(269.5, 183.3, 246.1)),
                      dot(wrappedP, vec3<f32>(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}

// 周期性 Gradient Noise
fn periodicNoise(p: vec3<f32>, period: f32) -> f32 {
    let p_vec = vec3<f32>(period);
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(dot(hash3_periodic(i + vec3<f32>(0.0,0.0,0.0), p_vec), f - vec3<f32>(0.0,0.0,0.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,0.0,0.0), p_vec), f - vec3<f32>(1.0,0.0,0.0)), u.x),
                   mix(dot(hash3_periodic(i + vec3<f32>(0.0,1.0,0.0), p_vec), f - vec3<f32>(0.0,1.0,0.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,1.0,0.0), p_vec), f - vec3<f32>(1.0,1.0,0.0)), u.x), u.y),
               mix(mix(dot(hash3_periodic(i + vec3<f32>(0.0,0.0,1.0), p_vec), f - vec3<f32>(0.0,0.0,1.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,0.0,1.0), p_vec), f - vec3<f32>(1.0,0.0,1.0)), u.x),
                   mix(dot(hash3_periodic(i + vec3<f32>(0.0,1.0,1.0), p_vec), f - vec3<f32>(0.0,1.0,1.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,1.0,1.0), p_vec), f - vec3<f32>(1.0,1.0,1.0)), u.x), u.y), u.z);
}

// 周期性 FBM
fn periodicFbm(p: vec3<f32>, octaves: i32, period: f32, initialAmplitude: f32) -> f32 {
    var value = 0.0;
    var amplitude = initialAmplitude;
    var currentPeriod = period;
    var pos = p;
    
    for (var i = 0; i < 5; i++) {
        if (i >= octaves) { break; }
        value = value + periodicNoise(pos, currentPeriod) * amplitude;
        pos = pos * 2.0;
        currentPeriod = currentPeriod * 2.0;
        amplitude = amplitude * 0.5;
    }
    return value;
}
`;

// ============================================================
// 节点 1: 基础噪声场
// 输出: vec4<f32> (主噪声, 扭曲X, 扭曲Y, 树结mask)
// ============================================================

export const baseNoiseFieldWGSL = /* wgsl */`
${noiseCommonWGSL}

struct Uniforms {
    tileSize: f32,
    knotFrequency: f32,
    knotThresholdMin: f32,
    knotThresholdMax: f32,
    distortionFreq: f32,
    fbmOctaves: f32,
    fbmAmplitude: f32,
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read_write> outputBuffer: array<vec4<f32>>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
    let x = globalId.x;
    let y = globalId.y;
    
    if (x >= u.width || y >= u.height) {
        return;
    }
    
    let uv = vec2<f32>(f32(x) / f32(u.width), f32(y) / f32(u.height));
    let scale = u.tileSize;
    let pos = vec3<f32>(uv * scale, 0.0);
    
    // 1. 主噪声
    let mainNoise = periodicNoise(pos, scale);
    
    // 2. 树结mask
    let knotNoise = periodicNoise(pos * u.knotFrequency, scale * u.knotFrequency);
    let knotMask = smoothstep(u.knotThresholdMin, u.knotThresholdMax, abs(knotNoise));
    
    // 3. 域扭曲向量
    let octaves = i32(u.fbmOctaves);
    let distortionX = periodicFbm(pos * u.distortionFreq, octaves, scale * u.distortionFreq, u.fbmAmplitude);
    let distortionY = periodicFbm((pos + vec3<f32>(100.0, 100.0, 0.0)) * u.distortionFreq, octaves, scale * u.distortionFreq, u.fbmAmplitude);
    
    // 输出
    let index = y * u.width + x;
    outputBuffer[index] = vec4<f32>(mainNoise, distortionX, distortionY, knotMask);
}
`;

// ============================================================
// 节点 2: 年轮密度场
// 输入: 节点1的扭曲数据
// 输出: vec4<f32> (ringSignal, ringPhase, ringCycle, ringProfile)
// ============================================================

export const ringDensityFieldWGSL = /* wgsl */`
${noiseCommonWGSL}

struct Uniforms {
    tileSize: f32,
    ringScale: f32,
    ringDistortion: f32,
    knotIntensity: f32,
    latewoodBias: f32,
    ringNoiseFreq: f32,
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> baseNoiseBuffer: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> outputBuffer: array<vec4<f32>>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
    let x = globalId.x;
    let y = globalId.y;
    
    if (x >= u.width || y >= u.height) {
        return;
    }
    
    let index = y * u.width + x;
    let baseNoise = baseNoiseBuffer[index];
    
    let uv = vec2<f32>(f32(x) / f32(u.width), f32(y) / f32(u.height));
    let scale = u.tileSize;
    let pos = vec3<f32>(uv * scale, 0.0);
    
    // 应用域扭曲
    let distortionX = baseNoise.y;
    let distortionY = baseNoise.z;
    let knotMask = baseNoise.w;
    let knotFactor = knotMask * u.knotIntensity;
    
    let distortionAmount = u.ringDistortion + knotFactor * 4.0;
    let finalPos = pos + vec3<f32>(distortionX, distortionY, 0.0) * distortionAmount;
    
    // 年轮距离场
    let dist = finalPos.x;
    
    // 年轮波形
    let ringPhase = dist * u.ringScale;
    let ringCycle = ringPhase - floor(ringPhase);
    let ringProfile = pow(ringCycle, u.latewoodBias);
    
    // 添加细节噪声
    let ringNoise = periodicNoise(pos * u.ringNoiseFreq, scale * u.ringNoiseFreq);
    let ringSignal = smoothstep(0.1, 0.9, ringProfile + ringNoise * 0.1);
    
    // 输出
    outputBuffer[index] = vec4<f32>(ringSignal, ringPhase, ringCycle, ringProfile);
}
`;

// ============================================================
// 节点 3: 髓射线
// 输入: 节点2的ringSignal
// 输出: vec4<f32> (rayPattern, rayVisibility, unused, unused)
// ============================================================

export const medullaryRaysWGSL = /* wgsl */`
${noiseCommonWGSL}

struct Uniforms {
    tileSize: f32,
    rayStrength: f32,
    rayFrequencyX: f32,
    rayFrequencyY: f32,
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> ringBuffer: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> outputBuffer: array<vec4<f32>>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
    let x = globalId.x;
    let y = globalId.y;
    
    if (x >= u.width || y >= u.height) {
        return;
    }
    
    let index = y * u.width + x;
    let ringData = ringBuffer[index];
    let ringSignal = ringData.x;
    
    let uv = vec2<f32>(f32(x) / f32(u.width), f32(y) / f32(u.height));
    let scale = u.tileSize;
    let pos = vec3<f32>(uv * scale, 0.0);
    
    // 髓射线噪声（方向性）
    let rayNoise = periodicNoise(
        vec3<f32>(pos.x * u.rayFrequencyX * 2.0, pos.y * u.rayFrequencyY, 0.0),
        scale * u.rayFrequencyX * 2.0
    );
    let rayPattern = abs(rayNoise);
    let rays = smoothstep(0.1, 0.3, rayPattern) * u.rayStrength;
    
    // 早材区域髓射线更明显
    let earlywoodWeight = ringSignal;
    let rayVisibility = rays * (0.1 + earlywoodWeight * 0.9);
    
    // 输出
    outputBuffer[index] = vec4<f32>(rayPattern, rayVisibility, 0.0, 0.0);
}
`;

// ============================================================
// 节点 4: 孔隙
// 输入: 节点2的ringSignal
// 输出: vec4<f32> (porePattern, poreMask, unused, unused)
// ============================================================

export const poresWGSL = /* wgsl */`
${noiseCommonWGSL}

struct Uniforms {
    tileSize: f32,
    poreDensity: f32,
    poreScale: f32,
    poreThresholdEarly: f32,
    poreThresholdLate: f32,
    poreThresholdRange: f32,
    poreStrength: f32,
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> ringBuffer: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> outputBuffer: array<vec4<f32>>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
    let x = globalId.x;
    let y = globalId.y;
    
    if (x >= u.width || y >= u.height) {
        return;
    }
    
    let index = y * u.width + x;
    let ringData = ringBuffer[index];
    let ringSignal = ringData.x;
    
    let uv = vec2<f32>(f32(x) / f32(u.width), f32(y) / f32(u.height));
    let scale = u.tileSize;
    let pos = vec3<f32>(uv * scale, 0.0);
    
    // 多频率孔隙噪声
    let poreFreq = u.poreDensity * u.poreScale;
    let poreNoise1 = periodicNoise(pos * poreFreq * 3.0, scale * poreFreq * 3.0);
    let poreNoise2 = periodicNoise(pos * poreFreq * 6.0 + vec3<f32>(0.5, 0.5, 0.0), scale * poreFreq * 6.0);
    let poreNoise3 = periodicNoise(pos * poreFreq * 12.0 + vec3<f32>(0.2, 0.8, 0.0), scale * poreFreq * 12.0);
    
    // 增强高频成分
    let poreNoiseMixed = (poreNoise1 * 0.5 + poreNoise2 * 0.8 + poreNoise3 * 1.2) / 2.5;
    let poreNoise01 = poreNoiseMixed * 0.5 + 0.5;
    
    // 动态阈值：早材区域孔隙更多
    let earlywoodWeight = ringSignal;
    let poreThresholdMin = mix(u.poreThresholdLate, u.poreThresholdEarly, earlywoodWeight);
    let poreThresholdMax = poreThresholdMin + u.poreThresholdRange;
    
    // 孔隙图案
    let porePattern = smoothstep(poreThresholdMin, poreThresholdMax, poreNoise01);
    let poreMask = porePattern * u.poreStrength * 2.5;
    
    // 输出
    outputBuffer[index] = vec4<f32>(porePattern, poreMask, 0.0, 0.0);
}
`;

// ============================================================
// 节点 5: 结构合成
// 输入: 节点2、3、4的输出
// 输出: vec4<f32> (finalDensity, ringSignal, pores, rays)
// ============================================================

export const structureCompositorWGSL = /* wgsl */`
${noiseCommonWGSL}

struct Uniforms {
    tileSize: f32,
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> ringBuffer: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> raysBuffer: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> poresBuffer: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputBuffer: array<vec4<f32>>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
    let x = globalId.x;
    let y = globalId.y;
    
    if (x >= u.width || y >= u.height) {
        return;
    }
    
    let index = y * u.width + x;
    
    let ringData = ringBuffer[index];
    let raysData = raysBuffer[index];
    let poresData = poresBuffer[index];
    
    let ringSignal = ringData.x;
    let rayVisibility = raysData.y;
    let poreMask = poresData.y;
    
    // 添加颜色变异
    let uv = vec2<f32>(f32(x) / f32(u.width), f32(y) / f32(u.height));
    let scale = u.tileSize;
    let pos = vec3<f32>(uv * scale, 0.0);
    let colorVariation = periodicNoise(pos * 3.0, scale * 3.0) * 0.08;
    
    // 最终合成
    var finalDensity = ringSignal + colorVariation;
    finalDensity = finalDensity - poreMask;              // 孔隙作为深色凹陷
    finalDensity = finalDensity + rayVisibility * 0.3;   // 髓射线作为浅色纹理
    finalDensity = clamp(finalDensity, 0.0, 1.0);
    
    // 输出: (finalDensity, ringSignal, poreMask, rayVisibility)
    outputBuffer[index] = vec4<f32>(finalDensity, ringSignal, poreMask, rayVisibility);
}
`;
