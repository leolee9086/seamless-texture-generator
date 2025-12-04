
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
    viewMatrix : mat4x4<f32>, // 仅用于预览，实际生成贴图时不需要
    
    // --- 核心参数 ---
    tileSize : f32,
    threadDensity : f32,
    threadThickness : f32,
    warpWeftRatio : f32,
    
    // --- 纱线结构 ---
    threadTwist : f32,
    fiberDetail : f32,
    fuzziness : f32,
    
    // --- 织造特征 ---
    weaveTightness : f32,
    threadUnevenness : f32,
    weaveImperfection : f32,
    
    padding1 : f32,
    
    // --- 高级参数 ---
    fbmOctaves : f32,
    fbmAmplitude : f32,
    noiseFrequency : f32,
    colorVariation : f32,
    
    // --- 光泽和材质 ---
    warpSheen : f32,
    weftSheen : f32,
    roughnessMin : f32,
    roughnessMax : f32,
    normalStrength : f32,
    
    // --- 纱线厚度调节 ---
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
// 核心逻辑：平纹织物生成
// -----------------------------------------------------------

// 生成单根纱线的截面形状（垂直于纱线方向）
fn threadProfile(t: f32, thickness: f32, tightness: f32) -> f32 {
    // 使用余弦函数生成圆润的纱线截面
    // t: 0-1 表示纱线宽度方向的位置
    let centered = (t - 0.5) * 2.0 / thickness; // 归一化到 [-1/thickness, 1/thickness]
    if (abs(centered) > 1.0) {
        return 0.0;
    }
    // 使用 smoothstep 来模拟纱线边缘的柔和过渡
    let profile = cos(centered * 3.14159265) * 0.5 + 0.5;
    // tightness 影响纱线的饱满度
    return pow(profile, 1.0 / (tightness * 0.5 + 0.5));
}

// 生成纱线扭曲效果
fn threadTwistPattern(pos: vec2<f32>, direction: vec2<f32>, twist: f32, scale: f32) -> f32 {
    // 沿纱线方向产生扭曲的明暗变化
    let alongThread = dot(pos, direction);
    let twistPhase = sin(alongThread * scale + twist * 10.0);
    return twistPhase * 0.5 + 0.5;
}

// 生成纤维细节
fn fiberDetail(pos: vec2<f32>, direction: vec2<f32>, detail: f32, scale: f32, period: f32) -> f32 {
    // 高频噪声模拟纤维纹理
    let perpDir = vec2<f32>(-direction.y, direction.x);
    let fiberPos = pos * 50.0 * detail * scale;
    let noise1 = periodicNoise2D(fiberPos, period * 50.0 * detail * scale);
    let noise2 = periodicNoise2D(fiberPos * 2.5, period * 50.0 * detail * scale * 2.5);
    return (noise1 * 0.7 + noise2 * 0.3) * detail;
}

// 生成毛绒效果
fn fuzzEffect(pos: vec2<f32>, fuzz: f32, scale: f32, period: f32) -> f32 {
    if (fuzz < 0.01) {
        return 0.0;
    }
    // 随机的小毛刺
    let fuzzNoise = periodicNoise2D(pos * 100.0 * scale, period * 100.0 * scale);
    let fuzzPattern = smoothstep(0.5, 0.8, fuzzNoise);
    return fuzzPattern * fuzz;
}

fn getPlainWeaveDetail(uv: vec2<f32>) -> vec4<f32> {
    let scale = u.tileSize;
    let pos = uv * scale;
    
    // 经纬线密度
    let warpDensity = u.threadDensity;
    let weftDensity = u.threadDensity * u.warpWeftRatio;
    
    // 计算经纬线的网格位置
    let warpPhase = fract(pos.x * warpDensity);
    let weftPhase = fract(pos.y * weftDensity);
    
    // 当前位置在网格中的坐标
    let warpCell = floor(pos.x * warpDensity);
    let weftCell = floor(pos.y * weftDensity);
    
    // 织造模式：平纹是经纬线交替上下
    // 使用棋盘模式确定哪根线在上面
    let warpOnTop = fract((warpCell + weftCell) * 0.5) > 0.25;
    
    // 添加织造不完美度（随机偏移）
    let imperfectionNoise = periodicNoise2D(vec2<f32>(warpCell, weftCell), scale * warpDensity);
    let imperfection = imperfectionNoise * u.weaveImperfection * 0.1;
    
    // 添加纱线粗细不均匀度
    let warpThicknessVar = 1.0 + periodicNoise2D(vec2<f32>(warpCell * 0.5, 0.0), scale * warpDensity * 0.5) * u.threadUnevenness * 0.3;
    let weftThicknessVar = 1.0 + periodicNoise2D(vec2<f32>(0.0, weftCell * 0.5), scale * weftDensity * 0.5) * u.threadUnevenness * 0.3;
    
    let warpThick = u.threadThickness * warpThicknessVar;
    let weftThick = u.threadThickness * weftThicknessVar;
    
    // 计算经纬线的截面高度
    let warpProfile = threadProfile(warpPhase + imperfection, warpThick, u.weaveTightness);
    let weftProfile = threadProfile(weftPhase + imperfection, weftThick, u.weaveTightness);
    
    // 根据织造模式决定哪根线的高度
    var height = 0.0;
    var isWarp = false; // 当前位置是经线还是纬线
    
    if (warpOnTop) {
        if (warpProfile > weftProfile) {
            height = warpProfile * u.threadHeightScale;
            isWarp = true;
        } else {
            height = weftProfile * u.threadHeightScale * 0.7; // 下面的线稍微低一些
            isWarp = false;
        }
    } else {
        if (weftProfile > warpProfile) {
            height = weftProfile * u.threadHeightScale;
            isWarp = false;
        } else {
            height = warpProfile * u.threadHeightScale * 0.7;
            isWarp = true;
        }
    }
    
    // 纱线交叉处的阴影
    let crossingShadow = (warpProfile * weftProfile) * u.threadShadowStrength * 0.5;
    
    // 纱线扭曲效果
    let warpDir = vec2<f32>(1.0, 0.0);
    let weftDir = vec2<f32>(0.0, 1.0);
    
    var twistBrightness = 0.0;
    if (isWarp) {
        twistBrightness = threadTwistPattern(pos, warpDir, u.threadTwist, warpDensity);
    } else {
        twistBrightness = threadTwistPattern(pos, weftDir, u.threadTwist, weftDensity);
    }
    
    // 纤维细节
    let octaves = i32(u.fbmOctaves);
    var fiberBrightness = 0.0;
    if (isWarp) {
        fiberBrightness = fiberDetail(pos, warpDir, u.fiberDetail, warpDensity, scale * warpDensity);
    } else {
        fiberBrightness = fiberDetail(pos, weftDir, u.fiberDetail, weftDensity, scale * weftDensity);
    }
    
    // 毛绒效果
    let fuzz = fuzzEffect(pos, u.fuzziness, max(warpDensity, weftDensity), scale * max(warpDensity, weftDensity));
    
    // 颜色变化
    let colorNoise = periodicFbm(vec3<f32>(pos * u.noiseFrequency, 0.0), octaves, scale * u.noiseFrequency, u.fbmAmplitude);
    let colorVar = colorNoise * u.colorVariation;
    
    // 合成最终密度信号
    var density = height;
    density = density * (0.8 + twistBrightness * 0.2); // 扭曲影响亮度
    density = density + fiberBrightness * 0.1; // 纤维细节
    density = density + fuzz * 0.15; // 毛绒增加亮度
    density = density - crossingShadow; // 交叉处变暗
    density = density + colorVar; // 颜色变化
    density = clamp(density, 0.0, 1.0);
    
    // 光泽信号（经纬线不同）
    var sheen = 0.0;
    if (isWarp) {
        sheen = u.warpSheen;
    } else {
        sheen = u.weftSheen;
    }
    
    return vec4<f32>(density, height, sheen, twistBrightness);
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
    // 获取织物结构数据
    let data = getPlainWeaveDetail(in.uv);
    let density = data.x;
    let height = data.y;
    let sheen = data.z;
    
    // 1. 颜色混合 - 使用渐变纹理采样
    let albedo = textureSample(gradientTexture, gradientSampler, vec2<f32>(density, 0.5)).rgb;
    
    // 2. 粗糙度混合
    // 根据光泽度和高度计算粗糙度
    let roughness = mix(u.roughnessMin, u.roughnessMax, 1.0 - sheen * height);
    
    // 3. 法线生成
    // 使用高度图计算法线
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    let normal = normalize(vec3<f32>(-dHdUV.x * u.normalStrength, -dHdUV.y * u.normalStrength, 1.0));
    
    // 4. 简单的光照预览
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let diff = max(dot(normal, lightDir), 0.0);
    
    // 添加光泽高光
    let viewDir = vec3<f32>(0.0, 0.0, 1.0);
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfDir), 0.0), 32.0 * (1.0 - roughness)) * sheen;
    
    let finalColor = albedo * (0.2 + 0.8 * diff) + vec3<f32>(spec * 0.5);
    
    return vec4<f32>(finalColor, 1.0);
}
`
