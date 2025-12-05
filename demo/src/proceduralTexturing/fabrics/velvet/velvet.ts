/**
 * VelvetParams 接口
 * 程序化天鹅绒/丝绒纹理参数
 */
export interface VelvetParams {
    tileSize: number;           // 平铺尺寸 (UV 0-1)

    // 基础材质
    baseColor: string;          // 基础底色 (Hex)
    sheenColor: string;         // 光泽颜色 (通常比底色更亮或偏白/偏冷)

    // 绒毛物理结构 (The Pile)
    pileHeight: number;         // 绒毛高度感 (0.0-1.0)
    pileDensity: number;        // 绒毛密度感 (0.0-1.0)
    pileSlant: number;          // 绒毛自然倒伏程度 (0.0-1.0, 0为直立, 1为完全倒伏)
    slantDirection: number;     // 倒伏方向角度 (0-360度)

    // 压痕与干扰 (Crushed Velvet Effect)
    crushStrength: number;      // 压痕强度 (0.0-1.0, 模拟乱纹天鹅绒)
    crushScale: number;         // 压痕纹理的大小/频率
    crushDetail: number;        // 压痕的边缘细节 (0.0-1.0)

    // 表面细节
    fiberGrain: number;         // 纤维颗粒感 (模拟微小噪点)
    stripes: number;            // 条纹感 (模拟灯芯绒 Corduroy, 0.0 为无, 1.0 为强)
    stripeFrequency: number;    // 条纹频率

    // 高级噪声控制
    fbmOctaves: number;         // 噪声迭代次数 (1-5)
    noiseRoughness: number;     // 噪声粗糙度 (影响高频细节)

    // 光照模型 (Velvet Sheen)
    sheenIntensity: number;     // 光泽强度
    sheenFalloff: number;       // 光泽衰减/范围 (Fresnel Power)
    ambientOcclusion: number;   // 绒毛根部的自阴影强度

    // 颜色变化
    colorVariation: number;     // 局部颜色微差
    lightSourceX: number;       // 模拟光源方向 X (-1 to 1)
    lightSourceY: number;       // 模拟光源方向 Y (-1 to 1)
}

export const velvetShaderWGSL = /* wgsl */`

struct Uniforms {
    viewMatrix : mat4x4<f32>, // 占位，保持对齐
    tileSize : f32,
    pileHeight : f32,
    pileDensity : f32,
    pileSlant : f32,
    slantDirection : f32,
    crushStrength : f32,
    crushScale : f32,
    crushDetail : f32,
    fiberGrain : f32,
    stripes : f32,
    stripeFrequency : f32,
    fbmOctaves : f32,
    noiseRoughness : f32,
    sheenIntensity : f32,
    sheenFalloff : f32,
    ambientOcclusion : f32,
    colorVariation : f32,
    lightSourceX : f32,
    lightSourceY : f32,
    baseColorR : f32,
    baseColorG : f32,
    baseColorB : f32,
    sheenColorR : f32,
    sheenColorG : f32,
    sheenColorB : f32,
    padding1 : f32, // Padding for 16-byte alignment
};

@group(0) @binding(0) var<uniform> u : Uniforms;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

// --- Noise Functions ---

fn hash2(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

fn hash2_periodic(p: vec2<f32>, period: vec2<f32>) -> vec2<f32> {
    let wrappedP = p % period;
    var q = vec2<f32>(dot(wrappedP, vec2<f32>(127.1, 311.7)),
                      dot(wrappedP, vec2<f32>(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}

fn periodicNoise2D(p: vec2<f32>, period: f32) -> f32 {
    let p_vec = vec2<f32>(period);
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(hash2_periodic(i + vec2<f32>(0.0,0.0), p_vec), f - vec2<f32>(0.0,0.0)),
                   dot(hash2_periodic(i + vec2<f32>(1.0,0.0), p_vec), f - vec2<f32>(1.0,0.0)), u.x),
               mix(dot(hash2_periodic(i + vec2<f32>(0.0,1.0), p_vec), f - vec2<f32>(0.0,1.0)),
                   dot(hash2_periodic(i + vec2<f32>(1.0,1.0), p_vec), f - vec2<f32>(1.0,1.0)), u.x), u.y);
}

// Flow Noise for Crushed Velvet (Rotational distortion)
fn flowFbm(p: vec2<f32>, octaves: i32, period: f32, persistence: f32) -> f32 {
    var value = 0.0;
    var amplitude = 1.0;
    var currentPeriod = period;
    var pos = p;
    var totalAmp = 0.0;
    
    for (var i = 0; i < 5; i++) {
        if (i >= octaves) { break; }
        value = value + periodicNoise2D(pos, currentPeriod) * amplitude;
        totalAmp = totalAmp + amplitude;
        pos = pos * 2.0;
        currentPeriod = currentPeriod * 2.0;
        amplitude = amplitude * persistence;
    }
    return value / totalAmp;
}

// --- Velvet Logic ---

fn rotateVector(v: vec3<f32>, axis: vec3<f32>, angle: f32) -> vec3<f32> {
    let c = cos(angle);
    let s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}

// Charlie Sheen NDF approximation for velvet
fn charlieD(NdotH: f32, roughness: f32) -> f32 {
    let invAlpha = 1.0 / roughness;
    let cos2h = NdotH * NdotH;
    let sin2h = 1.0 - cos2h;
    return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * 3.14159);
}

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position, 1.0);
    output.uv = uv;
    return output;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
    let uv = in.uv;
    let scale = u.tileSize;
    let pos = uv * scale;
    
    // 1. Generate "Crush" Map (The flow of the velvet fibers)
    // Velvet fibers aren't perfectly straight up. They lean.
    // Crushed velvet has regions leaning in chaotic directions.
    
    let crushPeriod = 10.0 * u.crushScale;
    let noise1 = flowFbm(pos * u.crushScale * 5.0, i32(u.fbmOctaves), crushPeriod, 0.5);
    let noise2 = flowFbm((pos + vec2<f32>(5.2, 1.3)) * u.crushScale * 5.0, i32(u.fbmOctaves), crushPeriod, 0.5);
    
    // Base slant direction (Global grain)
    let rad = radians(u.slantDirection);
    var fiberDir = vec3<f32>(cos(rad), sin(rad), 0.0);
    
    // Perturb fiber direction based on crush noise
    let randomAngle = (noise1 * 2.0 * 3.14159) * u.crushStrength;
    fiberDir = rotateVector(fiberDir, vec3<f32>(0.0, 0.0, 1.0), randomAngle);
    
    // 2. High Frequency "Micro-Fiber" Noise
    // Real velvet has millions of fibers. Standard perlin is too smooth.
    // We use a high frequency hash to simulate the random orientation of individual tips.
    let fiberFreq = 800.0 * (1.0 + u.pileDensity); // Very high frequency
    let microNoise = hash2(pos * fiberFreq); // 0.0 to 1.0 white noise
    
    // 3. Normal Construction
    // Combine macro lean (crush) with micro variation
    
    let leanAmount = u.pileSlant * (0.5 + 0.5 * noise2 * u.crushDetail); 
    
    // The "Macro" normal of the pile tuft
    var macroNormal = normalize(vec3<f32>(fiberDir.x * leanAmount, fiberDir.y * leanAmount, 1.0 - leanAmount * 0.5));
    
    // Apply Corduroy/Stripes
    if (u.stripes > 0.0) {
        let stripePattern = sin(dot(uv, vec2<f32>(cos(rad), sin(rad))) * u.stripeFrequency * 100.0);
        let stripeH = smoothstep(-0.5, 0.5, stripePattern);
        macroNormal = normalize(mix(macroNormal, vec3<f32>(0.0,0.0,1.0), (1.0 - stripeH) * u.stripes * 0.7));
    }
    
    // Perturb with micro-noise to get "fuzzy" normal
    // The fibers don't all point exactly the same way
    let grainStrength = u.fiberGrain * 0.3;
    // Map 0..1 to -1..1
    let microPerturb = (microNoise - 0.5) * 2.0; 
    var N = normalize(macroNormal + vec3<f32>(microPerturb * grainStrength, microPerturb * grainStrength, 0.0));
    
    // 4. Lighting Calculation
    
    let lightDir = normalize(vec3<f32>(u.lightSourceX, u.lightSourceY, 1.0));
    // View dir is top down
    let V = vec3<f32>(0.0, 0.0, 1.0); 
    let L = lightDir;
    let H = normalize(L + V);
    
    let NdotL = max(dot(N, L), 0.0);
    let NdotV = max(dot(N, V), 0.0);
    let NdotH = max(dot(N, H), 0.0);
    let VdotH = max(dot(V, H), 0.0);
    
    // A. Base Diffuse (Deep Scattering)
    // Velvet is dark when viewed straight on (light gets trapped) and bright at edges
    // But color also depends on light alignment.
    // We use a modified diffuse that is softer
    let diffuse = pow(NdotL, 1.0 + u.pileHeight) * (0.5 + 0.5 * u.ambientOcclusion);
    
    // B. Velvet Sheen
    // The "fuzzy" look comes from backscattering at grazing angles.
    // We approximate this using a term that gets stronger as N is perpendicular to V
    // or as L aligns with the fibers.
    
    // 1. Term dependent on View Angle (Rim / Grazing)
    // As NdotV approaches 0 (grazing), velvet gets brighter/sheenier.
    let grazing = 1.0 - NdotV;
    let rimSheen = pow(grazing, u.sheenFalloff);
    
    // 2. Term dependent on Light Angle relative to Fiber Normals (Backscatter)
    // "Charlie" Sheen like distribution
    let roughness = mix(0.3, 1.0, u.noiseRoughness);
    let sheenDist = charlieD(NdotH, roughness);
    
    // Combine terms
    let sheenFactor = (rimSheen + sheenDist * 0.5) * u.sheenIntensity;
    
    // 5. Color Composition
    let baseCol = vec3<f32>(u.baseColorR, u.baseColorG, u.baseColorB);
    let sheenCol = vec3<f32>(u.sheenColorR, u.sheenColorG, u.sheenColorB);
    
    // Color Variation (Large scale)
    let colVarNoise = flowFbm(pos * u.crushScale * 2.0, 2, crushPeriod, 0.5);
    // Darken the valleys/deep parts more
    let depth = 1.0 - (noise2 * 0.5 + 0.5); 
    let variedBase = baseCol * (1.0 + colVarNoise * u.colorVariation) * (mix(1.0, depth, u.ambientOcclusion * 0.5));
    
    // Mix Base and Sheen
    // Start with base
    var finalColor = variedBase * diffuse;
    
    // Add sheen (Additive)
    // Sheen should be masked by shadows, but velvet sheen often glows a bit even in soft light
    // We'll multiply by a soft shadow term
    let softShadow = smoothstep(-0.1, 0.2, NdotL); 
    finalColor = finalColor + sheenCol * sheenFactor * softShadow;
    
    // High frequency sparkle/grain (Simulates individual fiber tips catching light)
    // This is distinct from the normal map "grain", this is specular highlights on tips
    let sparkle = step(0.98 - u.pileDensity * 0.05, microNoise) * NdotL;
    // Sparkle is subtle
    finalColor = finalColor + sheenCol * sparkle * u.sheenIntensity * 0.2;
    
    return vec4<f32>(finalColor, 1.0);
}
`;