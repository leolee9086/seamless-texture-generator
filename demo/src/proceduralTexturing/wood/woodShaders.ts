/**
 * 木纹渲染器 - 拆分着色器模块
 * 包含三个独立的着色器用于管线化渲染
 */

// ============================================================
// 共享代码：噪声函数和木材结构生成
// ============================================================

export const woodCommonWGSL = /* wgsl */`
struct Uniforms {
    viewMatrix : mat4x4<f32>, // 仅用于预览，实际生成贴图时不需要
    
    // --- 核心参数 ---
    tileSize : f32,         // 控制无缝循环的周期
    ringScale : f32,
    ringDistortion : f32,
    knotIntensity : f32,
    latewoodBias : f32,     // 关键：控制年轮波形 (锯齿 vs 正弦)
    rayStrength : f32,
    poreDensity : f32,
    
    padding : f32, 
    
    // --- 高级参数 ---
    fbmOctaves : f32,
    fbmAmplitude : f32,
    knotFrequency : f32,
    distortionFreq : f32,
    ringNoiseFreq : f32,
    rayFrequencyX : f32,
    rayFrequencyY : f32,
    knotThresholdMin : f32,
    knotThresholdMax : f32,
    normalStrength : f32,
    roughnessMin : f32,
    roughnessMax : f32,
    
    // --- 孔隙参数 ---
    poreScale : f32,
    poreThresholdEarly : f32,
    poreThresholdLate : f32,
    poreThresholdRange : f32,
    poreStrength : f32,
};

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

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

// 木材结构生成函数
// 返回 vec4: (finalDensity, ringSignal, pores, raysVisible)
fn getWoodDetail(uv: vec2<f32>, u: Uniforms) -> vec4<f32> {
    let scale = u.tileSize;
    var pos = vec3<f32>(uv * scale, 0.0);
    
    // 1. 树结
    let knotNoise = periodicNoise(pos * u.knotFrequency, scale * u.knotFrequency);
    let knotFactor = smoothstep(u.knotThresholdMin, u.knotThresholdMax, abs(knotNoise)) * u.knotIntensity;
    
    // 2. 域扭曲
    let octaves = i32(u.fbmOctaves);
    var distortion = periodicFbm(pos * u.distortionFreq, octaves, scale * u.distortionFreq, u.fbmAmplitude);
    let finalPos = pos + vec3<f32>(distortion, distortion, 0.0) * (u.ringDistortion + knotFactor * 4.0);
    
    // 3. 年轮距离场
    let dist = finalPos.x; 
    
    // 4. 年轮波形
    let ringPhase = dist * u.ringScale;
    let ringCycle = ringPhase - floor(ringPhase);
    let ringProfile = pow(ringCycle, u.latewoodBias);
    
    let ringNoise = periodicNoise(pos * u.ringNoiseFreq, scale * u.ringNoiseFreq);
    let ringSignal = smoothstep(0.1, 0.9, ringProfile + ringNoise * 0.1);
    
    let colorVariation = periodicNoise(pos * 3.0, scale * 3.0) * 0.08;

    // 5. 髓射线
    let rayNoise = periodicNoise(vec3<f32>(pos.x * u.rayFrequencyX * 2.0, pos.y * u.rayFrequencyY, 0.0), scale * u.rayFrequencyX * 2.0);
    let rayPattern = abs(rayNoise);
    let rays = smoothstep(0.1, 0.3, rayPattern) * u.rayStrength;
    let earlywoodWeight = ringSignal;
    let raysVisible = rays * (0.1 + earlywoodWeight * 0.9);
    
    // 6. 孔隙 - 增强版
    let poreFreq = u.poreDensity * u.poreScale;
    // 使用更强的噪声叠加，增加对比度
    let poreNoise1 = periodicNoise(pos * poreFreq * 3.0, scale * poreFreq * 3.0);
    let poreNoise2 = periodicNoise(pos * poreFreq * 6.0 + vec3<f32>(0.5, 0.5, 0.0), scale * poreFreq * 6.0);
    let poreNoise3 = periodicNoise(pos * poreFreq * 12.0 + vec3<f32>(0.2, 0.8, 0.0), scale * poreFreq * 12.0);
    
    // 增强高频成分的权重，使孔隙更锐利
    let poreNoiseMixed = (poreNoise1 * 0.5 + poreNoise2 * 0.8 + poreNoise3 * 1.2) / 2.5;
    let poreNoise01 = poreNoiseMixed * 0.5 + 0.5;
    
    // 动态阈值：早材区域孔隙更多更明显
    let poreThresholdMin = mix(u.poreThresholdLate, u.poreThresholdEarly, earlywoodWeight);
    let poreThresholdMax = poreThresholdMin + u.poreThresholdRange;
    
    // 使用更陡峭的smoothstep创建更锐利的孔隙边缘
    let porePattern = smoothstep(poreThresholdMin, poreThresholdMax, poreNoise01);
    // 应用强度参数，并增加基础倍数（从1.0改为2.5，让参数范围更实用）
    let pores = porePattern * u.poreStrength * 2.5;

    // 最终合成
    var finalDensity = ringSignal + colorVariation;
    // 孔隙作为深色凹陷，减去值
    finalDensity = finalDensity - pores;
    // 髓射线作为浅色纹理，加上值
    finalDensity = finalDensity + raysVisible * 0.3;
    finalDensity = clamp(finalDensity, 0.0, 1.0);

    return vec4<f32>(finalDensity, ringSignal, pores, raysVisible);
}
`;

// ============================================================
// 着色器 1: 灰度生成 (输出两个渲染目标)
// ============================================================

export const grayscaleGenerationWGSL = /* wgsl */`
${woodCommonWGSL}

@group(0) @binding(0) var<uniform> u : Uniforms;

struct GrayscaleOutput {
    @location(0) grayscale : vec4<f32>,   // R通道存储finalDensity
    @location(1) structure : vec4<f32>,   // RGBA存储(ringSignal, pores, rays, unused)
};

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position, 1.0);
    output.uv = uv;
    return output;
}

@fragment
fn fs_main(in : VertexOutput) -> GrayscaleOutput {
    let data = getWoodDetail(in.uv, u);
    
    var output : GrayscaleOutput;
    // 灰度通道：只存储finalDensity（复制到RGB以便查看）
    output.grayscale = vec4<f32>(data.x, data.x, data.x, 1.0);
    // 结构通道：存储各个分量
    output.structure = data;
    
    return output;
}
`;

// ============================================================
// 着色器 2: 颜色应用 (读取灰度纹理 + 应用渐变)
// ============================================================

export const colorApplicationWGSL = /* wgsl */`
struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var grayscaleTexture : texture_2d<f32>;
@group(0) @binding(1) var textureSampler : sampler;
@group(0) @binding(2) var gradientTexture : texture_2d<f32>;
@group(0) @binding(3) var gradientSampler : sampler;

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position, 1.0);
    output.uv = uv;
    return output;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
    // 从灰度纹理读取密度值
    let density = textureSample(grayscaleTexture, textureSampler, in.uv).r;
    
    // 使用密度值采样渐变纹理
    let albedo = textureSample(gradientTexture, gradientSampler, vec2<f32>(density, 0.5));
    
    return albedo;
}
`;

// ============================================================
// 着色器 3: PBR材质生成 (法线 + 粗糙度)
// ============================================================

export const pbrMaterialWGSL = /* wgsl */`
struct Uniforms {
    normalStrength : f32,
    roughnessMin : f32,
    roughnessMax : f32,
    padding : f32,
};

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> u : Uniforms;
@group(0) @binding(1) var grayscaleTexture : texture_2d<f32>;
@group(0) @binding(2) var structureTexture : texture_2d<f32>;
@group(0) @binding(3) var textureSampler : sampler;

struct PBROutput {
    @location(0) normal : vec4<f32>,
    @location(1) roughness : vec4<f32>,
};

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position, 1.0);
    output.uv = uv;
    return output;
}

@fragment
fn fs_main(in : VertexOutput) -> PBROutput {
    let density = textureSample(grayscaleTexture, textureSampler, in.uv).r;
    let structure = textureSample(structureTexture, textureSampler, in.uv);
    
    // 计算粗糙度（基于ringSignal）
    let roughness = mix(u.roughnessMin, u.roughnessMax, structure.y);
    
    // 计算高度场
    let height = density * 0.1 - structure.z * 0.05;
    
    // 使用硬件导数计算法线
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    let normal = normalize(vec3<f32>(-dHdUV.x * u.normalStrength, -dHdUV.y * u.normalStrength, 1.0));
    
    // 编码法线到[0,1]范围
    let encodedNormal = normal * 0.5 + 0.5;
    
    var output : PBROutput;
    output.normal = vec4<f32>(encodedNormal, 1.0);
    output.roughness = vec4<f32>(roughness, roughness, roughness, 1.0);
    
    return output;
}
`;
