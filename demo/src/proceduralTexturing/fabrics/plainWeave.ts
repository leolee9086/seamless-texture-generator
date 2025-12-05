
/**
 * PlainWeaveParams 接口
 * 平纹织物程序化纹理参数
 */
export interface PlainWeaveParams {
    tileSize: number;           // 平铺尺寸 (例如 1.0 表示在 0-1 UV 内无缝循环)
    threadDensity: number;      // 纱线密度 (每单位长度的纱线数)
    threadThickness: number;    // 纱线粗细 (0.1-1.0)
    warpWeftRatio: number;      // 经纬线密度比 (0.5-2.0, 1.0表示相等)

    // 纱线结构
    threadTwist: number;        // 纱线捻度 (0.0-1.0)
    fiberDetail: number;        // 纤维细节程度 (0.0-1.0)
    fuzziness: number;          // 毛绒感 (0.0-1.0)

    // 织造特征
    weaveTightness: number;     // 织造紧密度 (0.0-1.0)
    threadUnevenness: number;   // 纱线粗细不均匀度 (0.0-1.0)
    weaveImperfection: number;  // 织造不完美度 (0.0-1.0, 模拟手工感)

    // 颜色渐变
    gradientStops: { offset: number, color: string }[];

    // 高级参数
    fbmOctaves: number;         // FBM 噪声的 octaves 数量 (1-5)
    fbmAmplitude: number;       // FBM 初始振幅 (0.1-1.0)
    noiseFrequency: number;     // 噪声频率 (1.0-10.0)
    colorVariation: number;     // 颜色变化幅度 (0.0-0.2)

    // 光泽和材质
    warpSheen: number;          // 经线光泽 (0.0-1.0)
    weftSheen: number;          // 纬线光泽 (0.0-1.0)
    roughnessMin: number;       // 最小粗糙度 (0.3-0.7)
    roughnessMax: number;       // 最大粗糙度 (0.7-1.0)
    normalStrength: number;     // 法线强度 (1.0-20.0)

    // 纱线厚度调节
    threadHeightScale: number;  // 纱线高度缩放 (0.5-2.0)
    threadShadowStrength: number; // 纱线交叉处阴影强度 (0.0-1.0)
}

export const plainWeaveShaderWGSL = /* wgsl */`

struct Uniforms {
    viewMatrix : mat4x4<f32>,
    tileSize : f32,
    threadDensity : f32,
    threadThickness : f32,
    warpWeftRatio : f32,
    threadTwist : f32,
    fiberDetail : f32,
    fuzziness : f32,
    weaveTightness : f32,
    threadUnevenness : f32,
    weaveImperfection : f32,
    padding1 : f32,
    fbmOctaves : f32,
    fbmAmplitude : f32,
    noiseFrequency : f32,
    colorVariation : f32,
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

// -----------------------------------------------------------
// 核心逻辑：平纹织物生成 (Revised)
// -----------------------------------------------------------

fn threadProfile(t: f32, thickness: f32, tightness: f32) -> f32 {
    let centered = (t - 0.5) * 2.0 / thickness;
    if (abs(centered) > 1.0) { return 0.0; }
    // Super-ellipse like shape for flatter or rounder threads
    // tightness 0 -> round, 1 -> flat boxy?
    // Let's stick to cosine for smoothness but power it
    let base = cos(centered * 1.5707963);
    return pow(base, 0.5 + tightness); 
}

fn threadTwistPattern(pos: vec2<f32>, direction: vec2<f32>, twist: f32, scale: f32) -> f32 {
    let alongThread = dot(pos, direction);
    let twistPhase = sin(alongThread * scale * 2.0 + twist * 20.0); // Increased frequency
    return twistPhase * 0.5 + 0.5;
}

fn fiberDetail(pos: vec2<f32>, direction: vec2<f32>, detail: f32, scale: f32, period: f32) -> f32 {
    let perpDir = vec2<f32>(-direction.y, direction.x);
    // Stretch noise along thread direction
    let fiberPos = vec2<f32>(dot(pos, direction), dot(pos, perpDir) * 10.0); 
    let noise1 = periodicNoise2D(fiberPos * 10.0 * scale, period * 10.0 * scale);
    return noise1 * detail;
}

fn fuzzEffect(pos: vec2<f32>, fuzz: f32, scale: f32, period: f32) -> f32 {
    if (fuzz < 0.01) { return 0.0; }
    let fuzzNoise = periodicNoise2D(pos * 80.0 * scale, period * 80.0 * scale);
    return smoothstep(0.6, 1.0, fuzzNoise) * fuzz;
}

fn getPlainWeaveDetail(uv: vec2<f32>) -> vec4<f32> {
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
    
    // Imperfections
    let imperfection = periodicNoise2D(vec2<f32>(i, j), scale * warpDensity) * u.weaveImperfection * 0.2;
    
    // Thread centers
    let warpCenter = 0.5 + imperfection;
    let weftCenter = 0.5 + imperfection; // Simplified, could be separate
    
    let dist_warp = abs(u_local - warpCenter);
    let dist_weft = abs(v_local - weftCenter);
    
    // Unevenness
    let warpThickVar = 1.0 + periodicNoise2D(vec2<f32>(i * 0.5, 0.0), scale * warpDensity * 0.5) * u.threadUnevenness * 0.3;
    let weftThickVar = 1.0 + periodicNoise2D(vec2<f32>(0.0, j * 0.5), scale * weftDensity * 0.5) * u.threadUnevenness * 0.3;
    
    let warpThick = u.threadThickness * warpThickVar;
    let weftThick = u.threadThickness * weftThickVar;
    
    // Profiles
    let warpP = threadProfile(u_local - imperfection, warpThick, u.weaveTightness);
    let weftP = threadProfile(v_local - imperfection, weftThick, u.weaveTightness);
    
    // Undulation (The Weave)
    // Warp goes over if (i+j) is even
    let isWarpOver = ((i + j) % 2.0) < 0.5; // Check parity
    
    // Sinusoidal paths
    // Warp Z varies along V
    // If warp is over at j, it should be high.
    // sin(v * PI) peaks at 0.5. 
    // If i+j even -> Warp High -> sin(v_local * PI)
    // If i+j odd -> Warp Low -> -sin(v_local * PI)
    // Wait, if it's low, it goes UNDER the weft.
    // The path should be continuous.
    // Let's use the global coordinate for phase?
    // Warp Path: sin(v_coord * PI) ?
    // At v=0.5 (j=0), sin(0.5PI) = 1.
    // At v=1.5 (j=1), sin(1.5PI) = -1.
    // So if i is even:
    //   j=0 -> Warp High (1). Correct (0+0 even).
    //   j=1 -> Warp Low (-1). Correct (0+1 odd).
    // So for even i, sin(v_coord * PI) works.
    // If i is odd:
    //   j=0 -> Warp Low (-1). (1+0 odd).
    //   j=1 -> Warp High (1). (1+1 even).
    //   sin(v_coord * PI) gives 1 at j=0. We need -1.
    //   So -sin(v_coord * PI) or sin(v_coord * PI + PI).
    
    let warpSign = select(-1.0, 1.0, (i % 2.0) < 0.5);
    let warpPath = sin(v_coord * 3.14159265) * warpSign;
    
    // Weft Path
    // Weft Z varies along U.
    // If i+j even -> Weft Low (under Warp).
    // If i+j odd -> Weft High (over Warp).
    // At u=0.5 (i=0):
    //   j=0 -> Weft Low (-1). (0+0 even).
    //   j=1 -> Weft High (1). (0+1 odd).
    //   We need -1 at j=0? No, we need -1 at i=0, j=0.
    //   Weft depends on u.
    //   At i=0 (u=0.5), we need Low (-1) if j is even?
    //   Wait, "Weft Low if i+j even".
    //   If j is even: i=0 -> Low (-1). i=1 -> High (1).
    //   sin(u_coord * PI) at u=0.5 is 1.
    //   So we need -sin(u_coord * PI) if j is even.
    //   If j is odd: i=0 -> High (1). i=1 -> Low (-1).
    //   We need sin(u_coord * PI) if j is odd.
    
    let weftSign = select(1.0, -1.0, (j % 2.0) < 0.5);
    let weftPath = sin(u_coord * 3.14159265) * weftSign;
    
    // Combine Path and Profile
    // The thread is a tube following the path.
    // Height = Path * Amplitude + Profile * Thickness/2
    
    let amp = u.threadHeightScale * 0.5;
    let warpH = warpPath * amp + warpP * u.threadHeightScale;
    let weftH = weftPath * amp + weftP * u.threadHeightScale;
    
    // Determine which is on top
    var h = 0.0;
    var isWarp = true;
    
    // Gap handling
    let noWarp = warpP < 0.01;
    let noWeft = weftP < 0.01;
    
    if (noWarp && noWeft) {
        h = 0.0; // Base level
    } else if (noWarp) {
        h = weftH;
        isWarp = false;
    } else if (noWeft) {
        h = warpH;
        isWarp = true;
    } else {
        // Soft blend or hard max? Hard max is more physically correct for opaque threads.
        if (warpH > weftH) {
            h = warpH;
            isWarp = true;
        } else {
            h = weftH;
            isWarp = false;
        }
    }
    
    // Shading & Details
    var density = h;
    
    // Twist
    var twistVal = 0.0;
    if (isWarp) {
        twistVal = threadTwistPattern(pos, vec2<f32>(0.0, 1.0), u.threadTwist, warpDensity);
    } else {
        twistVal = threadTwistPattern(pos, vec2<f32>(1.0, 0.0), u.threadTwist, weftDensity);
    }
    
    // Fiber
    var fiberVal = 0.0;
    if (isWarp) {
        fiberVal = fiberDetail(pos, vec2<f32>(0.0, 1.0), u.fiberDetail, warpDensity, scale * warpDensity);
    } else {
        fiberVal = fiberDetail(pos, vec2<f32>(1.0, 0.0), u.fiberDetail, weftDensity, scale * weftDensity);
    }
    
    // Fuzz
    let fuzzVal = fuzzEffect(pos, u.fuzziness, max(warpDensity, weftDensity), scale * max(warpDensity, weftDensity));
    
    // AO / Shadow at crossings
    // If the difference between warp and weft height is small, we are at a crossing/contact point.
    // Or simply, if we are deep (low h), it's darker.
    // Also, emphasize the edges where one thread goes under another.
    let depth = 1.0 - h;
    let shadow = depth * u.threadShadowStrength * 0.5;
    
    density = density * (0.9 + twistVal * 0.2);
    density = density + fiberVal * 0.1;
    density = density + fuzzVal * 0.1;
    density = density - shadow;
    
    // Color variation
    let colorNoise = periodicFbm(vec3<f32>(pos * u.noiseFrequency, 0.0), i32(u.fbmOctaves), scale * u.noiseFrequency, u.fbmAmplitude);
    density = density + colorNoise * u.colorVariation;
    
    density = clamp(density, 0.0, 1.0);
    
    // Sheen
    let sheen = select(u.weftSheen, u.warpSheen, isWarp);
    
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
    let data = getPlainWeaveDetail(in.uv);
    let density = data.x;
    let height = data.y;
    let sheen = data.z;
    
    let albedo = textureSample(gradientTexture, gradientSampler, vec2<f32>(density, 0.5)).rgb;
    
    let roughness = mix(u.roughnessMin, u.roughnessMax, 1.0 - sheen * 0.8); // Adjusted
    
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    let normal = normalize(vec3<f32>(-dHdUV.x * u.normalStrength, -dHdUV.y * u.normalStrength, 1.0));
    
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let diff = max(dot(normal, lightDir), 0.0);
    
    let viewDir = vec3<f32>(0.0, 0.0, 1.0);
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfDir), 0.0), 32.0 * (1.0 - roughness)) * sheen;
    
    let finalColor = albedo * (0.3 + 0.7 * diff) + vec3<f32>(spec * 0.6);
    
    return vec4<f32>(finalColor, 1.0);
}
`
