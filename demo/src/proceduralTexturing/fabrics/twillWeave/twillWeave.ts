/**
 * TwillWeaveParams 接口
 * 斜纹/人字纹织物程序化纹理参数
 * * 相比平纹，增加了斜纹周期控制和人字纹变体
 */
export interface TwillWeaveParams {
    tileSize: number;
    threadDensity: number;
    threadThickness: number;
    warpWeftRatio: number;

    // 纱线结构
    threadTwist: number;
    fiberDetail: number;
    fuzziness: number;

    // 斜纹特征 (新增)
    twillRepeat: number;        // 斜纹循环周期 (例如 4.0 表示 3/1 牛仔布, 3.0 表示 2/1)
    herringboneScale: number;   // 人字纹“人”字的大小 (0.0 表示普通斜纹, >1.0 表示人字纹宽度)
    waleDepth: number;          // 纹路深度 (斜纹凹凸感的强度)

    // 织造特征
    weaveTightness: number;
    threadUnevenness: number;
    weaveImperfection: number;

    // 颜色渐变
    gradientStops: { offset: number, color: string }[];

    // 高级参数
    fbmOctaves: number;
    fbmAmplitude: number;
    noiseFrequency: number;
    colorVariation: number;

    // 光泽和材质
    warpSheen: number;
    weftSheen: number;
    roughnessMin: number;
    roughnessMax: number;
    normalStrength: number;

    // 纱线厚度调节
    threadHeightScale: number;
    threadShadowStrength: number;
}

export const twillWeaveShaderWGSL = /* wgsl */`

struct Uniforms {
    viewMatrix : mat4x4<f32>,
    tileSize : f32,
    threadDensity : f32,
    threadThickness : f32,
    warpWeftRatio : f32,
    threadTwist : f32,
    fiberDetail : f32,
    fuzziness : f32,
    
    // Twill Specific
    twillRepeat : f32,
    herringboneScale : f32,
    waleDepth : f32,
    padding1 : f32,

    weaveTightness : f32,
    threadUnevenness : f32,
    weaveImperfection : f32,
    
    // Advanced
    fbmOctaves : f32,
    fbmAmplitude : f32,
    noiseFrequency : f32,
    colorVariation : f32,
    
    // Material
    warpSheen : f32,
    weftSheen : f32,
    roughnessMin : f32,
    roughnessMax : f32,
    normalStrength : f32,
    threadHeightScale : f32,
    threadShadowStrength : f32,
    padding2 : f32,
};

@group(0) @binding(0) var<uniform> u : Uniforms;
@group(0) @binding(1) var gradientTexture : texture_2d<f32>;
@group(0) @binding(2) var gradientSampler : sampler;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

// --- Noise Functions (Keep generic noise functions from previous implementation) ---
// 周期性伪随机哈希
fn hash3_periodic(p: vec3<f32>, period: vec3<f32>) -> vec3<f32> {
    let wrappedP = p % period;
    var q = vec3<f32>(dot(wrappedP, vec3<f32>(127.1, 311.7, 74.7)),
                      dot(wrappedP, vec3<f32>(269.5, 183.3, 246.1)),
                      dot(wrappedP, vec3<f32>(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}

fn hash2_periodic(p: vec2<f32>, period: vec2<f32>) -> vec2<f32> {
    let wrappedP = p % period;
    var q = vec2<f32>(dot(wrappedP, vec2<f32>(127.1, 311.7)),
                      dot(wrappedP, vec2<f32>(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}

// 周期性 Gradient Noise
fn periodicNoise(p: vec3<f32>, period: f32) -> f32 {
    let p_vec = vec3<f32>(period);
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f); // Hermite 插值

    return mix(mix(mix(dot(hash3_periodic(i + vec3<f32>(0.0,0.0,0.0), p_vec), f - vec3<f32>(0.0,0.0,0.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,0.0,0.0), p_vec), f - vec3<f32>(1.0,0.0,0.0)), u.x),
                   mix(dot(hash3_periodic(i + vec3<f32>(0.0,1.0,0.0), p_vec), f - vec3<f32>(0.0,1.0,0.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,1.0,0.0), p_vec), f - vec3<f32>(1.0,1.0,0.0)), u.x), u.y),
               mix(mix(dot(hash3_periodic(i + vec3<f32>(0.0,0.0,1.0), p_vec), f - vec3<f32>(0.0,0.0,1.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,0.0,1.0), p_vec), f - vec3<f32>(1.0,0.0,1.0)), u.x),
                   mix(dot(hash3_periodic(i + vec3<f32>(0.0,1.0,1.0), p_vec), f - vec3<f32>(0.0,1.0,1.0)),
                       dot(hash3_periodic(i + vec3<f32>(1.0,1.0,1.0), p_vec), f - vec3<f32>(1.0,1.0,1.0)), u.x), u.y), u.z);
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

fn periodicFbm2D(p: vec2<f32>, octaves: i32, period: f32, initialAmplitude: f32) -> f32 {
    var value = 0.0;
    var amplitude = initialAmplitude;
    var currentPeriod = period;
    var pos = p;
    
    for (var i = 0; i < 5; i++) {
        if (i >= octaves) { break; }
        value = value + periodicNoise2D(pos, currentPeriod) * amplitude;
        pos = pos * 2.0;
        currentPeriod = currentPeriod * 2.0;
        amplitude = amplitude * 0.5;
    }
    return value;
}




// -----------------------------------------------------------------------------


fn threadProfile(t: f32, thickness: f32, tightness: f32) -> f32 {
    let centered = (t - 0.5) * 2.0 / thickness;
    if (abs(centered) > 1.0) { return 0.0; }
    let base = cos(centered * 1.5707963);
    return pow(base, 0.5 + tightness); 
}

fn threadTwistPattern(pos: vec2<f32>, direction: vec2<f32>, twist: f32, scale: f32) -> f32 {
    let alongThread = dot(pos, direction);
    // 斜纹通常使用 "Z" 捻或 "S" 捻，这里模拟扭曲的微观法线变化
    let twistPhase = sin(alongThread * scale * 2.5 + twist * 25.0); 
    return twistPhase * 0.5 + 0.5;
}

fn fuzzEffect(pos: vec2<f32>, fuzz: f32, scale: f32, period: f32) -> f32 {
    if (fuzz < 0.01) { return 0.0; }
    let fuzzNoise = periodicNoise2D(pos * 60.0 * scale, period * 60.0 * scale);
    return smoothstep(0.5, 1.0, fuzzNoise) * fuzz;
}

fn getTwillWeaveDetail(uv: vec2<f32>) -> vec4<f32> {
    let scale = u.tileSize;
    let pos = uv * scale;
    
    let warpDensity = u.threadDensity;
    let weftDensity = u.threadDensity * u.warpWeftRatio;
    
    let u_coord = pos.x * warpDensity;
    let v_coord = pos.y * weftDensity;
    
    let i = floor(u_coord);
    let j = floor(v_coord);
    
    let u_local = fract(u_coord);
    let v_local = fract(v_coord);

    // --- Twill / Herringbone Logic ---
    
    // 计算位移 (Shift)
    // 普通斜纹: 每一行 j，i 的模式偏移 1
    // 人字纹: 根据 i 的位置翻转偏移方向
    
    var offset_j = j;
    
    if (u.herringboneScale > 1.0) {
        // 人字纹逻辑：根据列块 (Column Block) 决定对角线方向
        // floor(i / scale) 决定当前处于哪个 "Zig" 或 "Zag" 区域
        let zone = floor(i / u.herringboneScale);
        if (zone % 2.0 > 0.5) {
            // 反向斜纹
            offset_j = -j;
        }
    }
    
    // 核心斜纹公式：(i + j) % Repeat
    // 例如 3/1 斜纹 (Denim): Repeat=4. 0,1,2=Warp(Indio), 3=Weft(White)
    // 这里的 offset_j 实现了对角线
    let patternIndex = (i + offset_j) % u.twillRepeat;
    
    // 处理负数取模
    let pIndex = select(patternIndex, patternIndex + u.twillRepeat, patternIndex < 0.0);
    
    // 判定规则：大部分时间是经线 (Warp) 在上，少部分时间纬线 (Weft) 在上
    // 例如 3/1：只要 index < 3 都是 Warp
    let isWarpOver = pIndex < (u.twillRepeat - 1.0);

    // --- Thread Variations & Imperfections ---
    
    let imperfection = periodicNoise2D(vec2<f32>(i, j), scale * warpDensity) * u.weaveImperfection * 0.2;
    
    // Thread width variation
    let warpThickVar = 1.0 + periodicNoise2D(vec2<f32>(i * 0.5, 0.0), scale * warpDensity * 0.5) * u.threadUnevenness * 0.3;
    let weftThickVar = 1.0 + periodicNoise2D(vec2<f32>(0.0, j * 0.5), scale * weftDensity * 0.5) * u.threadUnevenness * 0.3;
    
    let warpThick = u.threadThickness * warpThickVar;
    let weftThick = u.threadThickness * weftThickVar;
    
    // Profiles
    let warpP = threadProfile(u_local - imperfection, warpThick, u.weaveTightness);
    let weftP = threadProfile(v_local - imperfection, weftThick, u.weaveTightness);
    
    // --- Height / Undulation Calculation ---
    
    // 斜纹的浮长较长 (Floating). 
    // 如果是 Warp Over，Warp 保持高位，Weft 保持低位。
    // 在交织点 (Interlacing point)，它们交换高度。
    
    // 简化模拟：
    // Base Height based on Who is On Top
    // Add sinusoidal curve only near the transition edges?
    // Or simpler: Global sine waves adjusted by "Who is on top".
    
    let amp = u.threadHeightScale * 0.5 * u.waleDepth; // 斜纹纹路更深
    
    // 基础高度逻辑
    var warpH = 0.0;
    var weftH = 0.0;
    
    if (isWarpOver) {
        // Warp is floating over. It's high.
        warpH = 1.0; 
        // Weft is buried under.
        weftH = -0.5; 
    } else {
        // Weft is floating over (short float usually).
        warpH = -0.5;
        weftH = 1.0;
    }
    
    // Add profile shape to height
    warpH = warpH * amp + warpP * u.threadHeightScale;
    weftH = weftH * amp + weftP * u.threadHeightScale;
    
    // Gap Logic
    var h = 0.0;
    var isWarpFinal = isWarpOver;
    
    if (warpP < 0.01 && weftP < 0.01) {
        h = -1.0; // Hole
    } else if (warpP < 0.01) {
        h = weftH;
        isWarpFinal = false;
    } else if (weftP < 0.01) {
        h = warpH;
        isWarpFinal = true;
    } else {
        // Smooth intersection? No, fabrics are physically stacked.
        if (warpH > weftH) {
            h = warpH;
            isWarpFinal = true;
        } else {
            h = weftH;
            isWarpFinal = false;
        }
    }
    
    // --- Shading & Details ---
    
    var density = h; // Map height to color density base
    
    // Twist & Fiber
    var twistVal = 0.0;
    // Warp goes vertical (along Y), Weft horizontal (along X)
    if (isWarpFinal) {
        twistVal = threadTwistPattern(pos, vec2<f32>(0.0, 1.0), u.threadTwist, warpDensity);
        // Warp 往往比较紧，纤维细节不同
        density = density + periodicNoise2D(pos * 200.0, 10.0) * u.fiberDetail * 0.1;
    } else {
        twistVal = threadTwistPattern(pos, vec2<f32>(1.0, 0.0), u.threadTwist, weftDensity);
        density = density + periodicNoise2D(pos * 200.0, 10.0) * u.fiberDetail * 0.15; // Weft often fluffier
    }
    
    // Fuzz
    let fuzzVal = fuzzEffect(pos, u.fuzziness, max(warpDensity, weftDensity), scale);
    
    // Shadow / Occlusion (Deep parts get darker)
    // 斜纹的深处是交织点下陷的地方
    let occlusion = smoothstep(0.0, -0.8, h); 
    density = density - occlusion * u.threadShadowStrength;
    
    // Twist influence on lighting
    density = density + (twistVal - 0.5) * 0.1;
    
    // Fuzz adds lightness usually (scattering)
    density = density + fuzzVal * 0.15;
    
    density = clamp(density, 0.0, 1.0);
    
    // Color Noise Variation (Denim wash effect)
    // Use lower frequency noise for "wash" look
    let washNoise = periodicNoise2D(pos * u.noiseFrequency * 0.5, scale);
    density = density + washNoise * u.colorVariation;
    
    // Sheen
    let sheen = select(u.weftSheen, u.warpSheen, isWarpFinal);
    
    return vec4<f32>(density, h, sheen, twistVal);
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
    let data = getTwillWeaveDetail(in.uv);
    let density = data.x;
    let height = data.y;
    let sheen = data.z;
    let twist = data.w;
    
    // Sampling Gradient
    // For Denim: High density (Warp top) -> Blue. Low density (Weft top or Shadow) -> White/Dark.
    let albedo = textureSample(gradientTexture, gradientSampler, vec2<f32>(clamp(density, 0.01, 0.99), 0.5)).rgb;
    
    let roughness = mix(u.roughnessMin, u.roughnessMax, 1.0 - sheen);
    
    // Normal Map Generation
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    // Add micro-normal from twist
    let twistNormal = (twist - 0.5) * 0.5; 
    
    let normal = normalize(vec3<f32>(
        -dHdUV.x * u.normalStrength, 
        -dHdUV.y * u.normalStrength + twistNormal, // Twist affects Y normal for Warp
        1.0
    ));
    
    // Simple Lighting
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let NdotL = max(dot(normal, lightDir), 0.0);
    
    // Anisotropic Highlight (Crucial for Twill)
    // Approximate anisotropy by modifying roughness based on view angle vs thread direction
    // Simplified Blinn-Phong here
    let viewDir = vec3<f32>(0.0, 0.0, 1.0);
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfDir), 0.0), 48.0 * (1.0 - roughness)) * sheen;
    
    let finalColor = albedo * (0.2 + 0.8 * NdotL) + vec3<f32>(spec);
    
    return vec4<f32>(finalColor, 1.0);
}
`