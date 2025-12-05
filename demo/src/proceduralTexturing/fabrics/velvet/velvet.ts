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

// --- Noise Functions (复用且增强的高质量噪声) ---

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

// 旋转向量工具
fn rotateVector(v: vec3<f32>, axis: vec3<f32>, angle: f32) -> vec3<f32> {
    let c = cos(angle);
    let s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
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
    
    // 1. Base Normal Generation (Flat surface initially)
    var normal = vec3<f32>(0.0, 0.0, 1.0);
    
    // 2. Generate "Crush" Map (The flow of the velvet fibers)
    // Velvet fibers aren't perfectly straight up. They lean.
    // Crushed velvet has regions leaning in chaotic directions.
    
    let crushPeriod = 10.0 * u.crushScale;
    let noise1 = flowFbm(pos * u.crushScale * 5.0, i32(u.fbmOctaves), crushPeriod, 0.5);
    let noise2 = flowFbm((pos + vec2<f32>(5.2, 1.3)) * u.crushScale * 5.0, i32(u.fbmOctaves), crushPeriod, 0.5);
    
    // Base slant direction (Global grain)
    let rad = radians(u.slantDirection);
    var fiberDir = vec3<f32>(cos(rad), sin(rad), 0.0);
    
    // Perturb fiber direction based on crush noise
    // The crushStrength mixes between uniform slant and chaotic swirl
    let randomAngle = (noise1 * 2.0 * 3.14159) * u.crushStrength;
    fiberDir = rotateVector(fiberDir, vec3<f32>(0.0, 0.0, 1.0), randomAngle);
    
    // Calculate the actual normal of the fibers
    // If slant is 0, normal is (0,0,1). If slant is 1, it lays nearly flat.
    // We modify the Z component based on slant.
    // However, for lighting, we usually treat the "Micro-facet" normal distribution.
    // Here we simulate the aggregate normal of a cluster of fibers.
    
    let leanAmount = u.pileSlant * (0.5 + 0.5 * noise2 * u.crushDetail); // Varying lean height
    let tangent = normalize(vec3<f32>(fiberDir.x, fiberDir.y, 1.0 - leanAmount)); 
    
    // Apply Corduroy/Stripes effect (Modulates the normal height/lean)
    if (u.stripes > 0.0) {
        let stripePattern = sin(dot(uv, vec2<f32>(cos(rad), sin(rad))) * u.stripeFrequency * 100.0);
        let stripeH = smoothstep(-0.5, 0.5, stripePattern);
        // Stripes affect the normal Z (height) and create valleys
        normal = normalize(mix(tangent, vec3<f32>(0.0,0.0,1.0), (1.0 - stripeH) * u.stripes * 0.5));
    } else {
        normal = tangent;
    }
    
    // 3. Micro-details (Grain)
    let grainFreq = 200.0 * (1.0 + u.pileDensity);
    let grain = periodicNoise2D(pos * grainFreq, scale * grainFreq);
    // Perturb normal slightly for grain
    normal = normalize(normal + vec3<f32>(grain, grain, 0.0) * u.fiberGrain * 0.1);
    
    // 4. Lighting Calculation (Velvet / Sheen Model)
    
    // Light and View setup
    // We simulate a light source that is slightly off-center to show anisotropy
    let lightDir = normalize(vec3<f32>(u.lightSourceX, u.lightSourceY, 1.0));
    let viewDir = vec3<f32>(0.0, 0.0, 1.0); // Top-down view for texture generation
    
    let L = lightDir;
    let V = viewDir;
    let N = normal;
    let H = normalize(L + V);
    
    // --- Velvet Lighting Physics ---
    
    // A. Diffuse (Wrap lighting to simulate sub-surface scattering in pile)
    let NdotL = dot(N, L);
    let diffuseTerm = max(NdotL, 0.0) * 0.6 + 0.4; // Wrap lighting
    
    // B. Sheen / Asperity Scattering
    // The key to velvet is that it brightens at grazing angles (edges) or when fibers point at light.
    // Standard specular (Blinn-Phong) looks like plastic.
    // We use a simplified form of Ashikhmin or Charlie sheen.
    
    // "Backscattering" component: light reflects off the tips
    let dotNH = max(dot(N, H), 0.0);
    let sheenDist = pow(1.0 - dotNH, u.sheenFalloff * 0.5); // Invert standard specular logic somewhat
    
    // Rim effect: when the fiber side faces the view
    let edgeness = 1.0 - max(dot(N, V), 0.0);
    let rim = pow(edgeness, u.sheenFalloff);
    
    // Combine sheen
    let sheenValue = (sheenDist * 0.5 + rim * 0.5) * u.sheenIntensity;
    
    // 5. Color Blending
    
    let baseCol = vec3<f32>(u.baseColorR, u.baseColorG, u.baseColorB);
    let sheenCol = vec3<f32>(u.sheenColorR, u.sheenColorG, u.sheenColorB);
    
    // Color variation noise (larger patches)
    let colVarNoise = flowFbm(pos * u.crushScale * 2.0, 2, crushPeriod, 0.5);
    let variedBase = baseCol * (1.0 + colVarNoise * u.colorVariation);
    
    // AO calculation based on "depth" of fibers
    // If the fiber is standing up (N.z is high) vs laying down.
    // Or based on stripe valleys.
    var ao = 1.0;
    if (u.stripes > 0.0) {
        let stripePattern = sin(dot(uv, vec2<f32>(cos(rad), sin(rad))) * u.stripeFrequency * 100.0);
        ao = smoothstep(-1.0, 0.5, stripePattern); // Darker in valleys
        ao = mix(1.0, ao, u.ambientOcclusion);
    }
    
    // Composite
    // Darker when looking directly into the pile (N aligned with V) -> handled by rim logic inverse?
    // Actually velvet is often darker where fibers are upright and facing viewer (traps light), 
    // and lighter where crushed flat or at edges.
    
    // Self-shadowing approximation:
    // If N points away from light strongly, it should be dark (shadows between fibers).
    let shadow = smoothstep(-0.2, 0.2, NdotL);
    
    var finalColor = variedBase * diffuseTerm * shadow * ao;
    
    // Add Sheen (additive)
    finalColor = finalColor + sheenCol * sheenValue * shadow;
    
    // Dithering to prevent banding in dark gradients
    let dither = (fract(sin(dot(uv, vec2<f32>(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.01;
    finalColor = finalColor + dither;

    return vec4<f32>(finalColor, 1.0);
}
`;