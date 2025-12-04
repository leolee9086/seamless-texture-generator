
/**
 * AdvancedWoodParams 接口
 * 包含更专业的生物学参数
 */
interface WoodParams {
    tileSize: number;       // 平铺尺寸 (例如 1.0 表示在 0-1 UV 内无缝循环)
    ringScale: number;      // 年轮总数
    ringDistortion: number; // 生长扭曲度
    knotIntensity: number;  // 树结强度
    latewoodBias: number;   // 晚材偏差 (0.0-1.0, 控制深色硬边部分的尖锐度)
    rayStrength: number;    // 髓射线强度 (垂直于年轮的细纹)
    poreDensity: number;    // 导管/毛孔密度
    colorEarly: number[];   // 早材颜色 (浅)
    colorLate: number[];    // 晚材颜色 (深)

    // 高级参数
    fbmOctaves: number;     // FBM 噪声的 octaves 数量 (1-5)
    fbmAmplitude: number;   // FBM 初始振幅 (0.1-1.0)
    knotFrequency: number;  // 树结噪声频率 (0.5-2.0)
    distortionFreq: number; // 域扭曲频率 (1.0-3.0)
    ringNoiseFreq: number;  // 年轮噪声频率 (3.0-10.0)
    rayFrequencyX: number;  // 髓射线 X 方向频率 (30.0-100.0)
    rayFrequencyY: number;  // 髓射线 Y 方向频率 (1.0-5.0)
    knotThresholdMin: number; // 树结阈值最小值 (0.0-1.0)
    knotThresholdMax: number; // 树结阈值最大值 (0.0-1.0)
    normalStrength: number;   // 法线强度 (1.0-20.0)
    roughnessMin: number;     // 最小粗糙度 (0.1-0.5)
    roughnessMax: number;     // 最大粗糙度 (0.5-1.0)

    // 孔隙参数
    poreScale: number;          // 孔隙尺寸 (0.5-5.0)
    poreThresholdEarly: number; // 早材孔隙阈值下限 (0.0-1.0)
    poreThresholdLate: number;  // 晚材孔隙阈值下限 (0.0-1.0)
    poreThresholdRange: number; // 阈值范围 (0.1-0.3)
    poreStrength: number;       // 孔隙强度 (0.0-1.0)
}

export const woodShaderWGSL = /* wgsl */`

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
    
    colorEarly : vec3<f32>,
    padding2 : f32,
    colorLate : vec3<f32>,
    padding3 : f32,
    
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

@group(0) @binding(0) var<uniform> u : Uniforms;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>, // 使用 UV 空间以保证平铺
};

// -----------------------------------------------------------
// 核心：可平铺噪声算法 (Seamless Tileable Noise)
// -----------------------------------------------------------

// 周期性伪随机哈希
// 输入 p，在 period 范围内循环，保证边界连续
fn hash3_periodic(p: vec3<f32>, period: vec3<f32>) -> vec3<f32> {
    // 关键：对坐标取模，实现无缝
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
    let u = f * f * (3.0 - 2.0 * f); // Hermite 插值

    // 在哈希查找时应用周期性逻辑
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
        currentPeriod = currentPeriod * 2.0; // 频率翻倍，周期也需要适应
        amplitude = amplitude * 0.5;
    }
    return value;
}

// -----------------------------------------------------------
// 非周期性噪声（用于效果优化）
// -----------------------------------------------------------

// 标准伪随机哈希（非周期性）
fn hash2(p: vec2<f32>) -> vec2<f32> {
    var h = vec2<f32>(dot(p, vec2<f32>(127.1, 311.7)),
                      dot(p, vec2<f32>(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(h) * 43758.5453123);
}

// 2D Worley 噪声（细胞噪声）
// 返回最近距离（0-1 范围）
fn worleyNoise(p: vec2<f32>, frequency: f32) -> f32 {
    let scaledP = p * frequency;
    let cell = floor(scaledP);
    let localPos = fract(scaledP);
    
    var minDist = 1.0;
    
    // 检查 3x3 邻域
    for (var dx = -1.0; dx <= 1.0; dx = dx + 1.0) {
        for (var dy = -1.0; dy <= 1.0; dy = dy + 1.0) {
            let neighborCell = cell + vec2<f32>(dx, dy);
            // 为每个单元格生成随机点
            let randomPoint = hash2(neighborCell) * 0.5 + 0.5; // 0-1 范围内
            let pointPos = neighborCell + randomPoint;
            let dist = distance(scaledP, pointPos);
            if (dist < minDist) {
                minDist = dist;
            }
        }
    }
    // 归一化距离（假设最大距离约为 sqrt(2)）
    return 1.0 - minDist * 0.707; // 使距离越近值越大
}

// 密集髓射线生成
// 使用多个频率的噪声叠加
fn generateRays(pos: vec2<f32>, frequencyX: f32, frequencyY: f32, strength: f32, earlywoodWeight: f32) -> f32 {
    // 基础条纹噪声（垂直于年轮方向）
    let ray1 = sin(pos.x * frequencyX * 2.0 + pos.y * frequencyY * 0.5);
    let ray2 = sin(pos.x * frequencyX * 3.0 + pos.y * frequencyY * 1.2);
    let rayNoise = periodicNoise(vec3<f32>(pos.x * frequencyX * 4.0, pos.y * frequencyY * 2.0, 0.0), 100.0);
    
    // 混合
    let rayPattern = (ray1 * 0.5 + ray2 * 0.3 + rayNoise * 0.2) * 0.5 + 0.5;
    // 阈值化产生细条纹
    let rays = smoothstep(0.4, 0.6, rayPattern) * strength;
    // 早材区域增强
    return rays * (0.2 + earlywoodWeight * 0.8);
}

// -----------------------------------------------------------
// 核心逻辑：生物学木材生成
// -----------------------------------------------------------

fn getWoodDetail(uv: vec2<f32>) -> vec4<f32> {
    // 将 UV 映射到世界尺度，基于 tileSize 实现循环
    let scale = u.tileSize;
    var pos = vec3<f32>(uv * scale, 0.0); // Z轴可以是时间或切片位置
    
    // 1. 模拟树结 (Knots) - 极其重要
    // 树结是木材纹理流动的引力中心
    // 使用低频噪声模拟随机的生长压力中心
    let knotNoise = periodicNoise(pos * u.knotFrequency, scale * u.knotFrequency);
    // 如果噪声值超过阈值，产生强烈的局部扭曲
    let knotFactor = smoothstep(u.knotThresholdMin, u.knotThresholdMax, abs(knotNoise)) * u.knotIntensity;
    
    // 2. 域扭曲 (Domain Warping)
    // 基础生长扭曲 + 树结扭曲
    // 注意：所有噪声必须使用 periodicFbm 且传入 scale 以保证无缝
    let octaves = i32(u.fbmOctaves);
    var distortion = periodicFbm(pos * u.distortionFreq, octaves, scale * u.distortionFreq, u.fbmAmplitude);
    // 树结会极大地拉扯坐标
    let finalPos = pos + vec3<f32>(distortion, distortion, 0.0) * (u.ringDistortion + knotFactor * 4.0);
    
    // 3. 计算"年轮距离场"
    // 在 2D 平面上，我们将 X 轴视为半径方向 (Quartersawn look) 或使用距离场模拟树心
    // 这里为了无缝平铺，我们模拟切面纹理（板材），而非整棵树的横截面
    let dist = finalPos.x; 
    
    // 4. 生物学年轮波形 (The Sawtooth Profile)
    // 木头不是正弦波。它由早材(生长快, 宽, 软)过渡到晚材(生长慢, 窄, 硬)。
    // 这种波形类似于锯齿波，但带有曲线。
    let ringPhase = dist * u.ringScale;
    let ringCycle = ringPhase - floor(ringPhase); // 0.0 到 1.0 的循环
    
    // 使用 Power 函数调整波形：
    // latewoodBias 越大，曲线越偏向一侧，形成尖锐的深色条纹（晚材）
    // 这种非线性映射产生了真实的"硬边"效果
    let ringProfile = pow(ringCycle, u.latewoodBias); // 0.2 (圆润) - 5.0 (尖锐)
    
    // 反转并混合，得到基础密度信号 (0 = 晚材/深, 1 = 早材/浅)
    // 我们加入一些扰动，让每条年轮的粗细不完全一致
    // 为年轮添加随机变化，增加自然感
    let ringNoise = periodicNoise(pos * u.ringNoiseFreq, scale * u.ringNoiseFreq);
    let ringSignal = smoothstep(0.1, 0.9, ringProfile + ringNoise * 0.1);
    
    // 添加局部颜色变化（模拟木材的不均匀性）
    let colorVariation = periodicNoise(pos * 3.0, scale * 3.0) * 0.08;

    // 5. 髓射线 (Medullary Rays) - 优化版
    // 使用更高频率和更细的条纹
    let rayNoise = periodicNoise(vec3<f32>(pos.x * u.rayFrequencyX * 2.0, pos.y * u.rayFrequencyY, 0.0), scale * u.rayFrequencyX * 2.0);
    // 使用更窄的阈值范围产生更细的条纹
    let rayPattern = abs(rayNoise);
    // 提高阈值以产生更细密的条纹，同时增加密度
    let rays = smoothstep(0.1, 0.3, rayPattern) * u.rayStrength;
    // 早材区域定义：ringSignal高的地方是早材（浅色），ringSignal低的地方是晚材（深色）
    // ringSignal范围是0-1，值越大越接近早材
    let earlywoodWeight = ringSignal;
    // 射线在早材区域强度更高，晚材也有少量可见
    let raysVisible = rays * (0.1 + earlywoodWeight * 0.9);
    
    // 6. 导管孔隙 (Pores) - 使用可调参数版本
    // 使用poreScale控制孔隙大小，poreDensity控制孔隙数量
    let poreFreq = u.poreDensity * u.poreScale;
    let poreNoise1 = periodicNoise(pos * poreFreq * 3.0, scale * poreFreq * 3.0);
    let poreNoise2 = periodicNoise(pos * poreFreq * 6.0 + vec3<f32>(0.5, 0.5, 0.0), scale * poreFreq * 6.0);
    let poreNoise3 = periodicNoise(pos * poreFreq * 12.0 + vec3<f32>(0.2, 0.8, 0.0), scale * poreFreq * 12.0);
    // 混合噪声，早材区域增加高频成分（periodicNoise范围是-1到1）
    let poreNoiseMixed = (poreNoise1 + poreNoise2 * 0.7 + poreNoise3 * 0.5) / 2.2;
    // 关键：将噪声从-1到1映射到0-1范围
    let poreNoise01 = poreNoiseMixed * 0.5 + 0.5;
    // 动态阈值：使用用户提供的参数，早材区域使用更低的阈值产生更多孔隙
    let poreThresholdMin = mix(u.poreThresholdLate, u.poreThresholdEarly, earlywoodWeight);
    let poreThresholdMax = poreThresholdMin + u.poreThresholdRange;
    let porePattern = smoothstep(poreThresholdMin, poreThresholdMax, poreNoise01);
    // 使用用户提供的强度参数
    let pores = porePattern * u.poreStrength;

    // --- 最终合成 ---
    // 组合密度信号，添加随机颜色变化
    var finalDensity = ringSignal + colorVariation;
    finalDensity = finalDensity - pores; // 孔隙是暗凹陷
    finalDensity = finalDensity + raysVisible * 0.3; // 射线略亮
    finalDensity = clamp(finalDensity, 0.0, 1.0);

    return vec4<f32>(finalDensity, ringSignal, pores, raysVisible); // 返回各通道供 PBR 使用
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
    // 获取木材结构数据
    // x: 综合密度 (用于颜色)
    // y: 年轮原始信号 (用于粗糙度)
    // z: 孔隙 (用于法线)
    // w: 射线
    let data = getWoodDetail(in.uv);
    let density = data.x;
    
    // 1. 颜色混合
    var albedo = mix(u.colorLate, u.colorEarly, density);
    
    // 2. 物理属性 (PBR)
    // 粗糙度：孔隙和晚材(深色)更粗糙，早材更光滑，但髓射线通常很光滑(高光)
    var roughness = mix(u.roughnessMax, u.roughnessMin, density);
    roughness = max(roughness - data.w * 0.3, u.roughnessMin * 0.5); // 射线增加反光
    roughness = min(roughness + data.z * 1.0, 1.0); // 孔隙非常粗糙
    
    // 3. 高质量法线生成
    // 这里的关键是：我们不只用颜色计算法线，而是用特定的高度图通道
    // 早材高，晚材低，孔隙深凹
    let height = density * 0.1 - data.z * 0.05; // 孔隙产生深度
    
    // 使用偏导数计算法线 (在像素着色器中无需重复采样，极大提升性能)
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    // 调整法线强度
    let normal = normalize(vec3<f32>(-dHdUV.x * u.normalStrength, -dHdUV.y * u.normalStrength, 1.0));
    
    // 4. 简单的光照预览 (实际使用时通常只输出 G-Buffer: Albedo, Normal, Roughness)
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let diff = max(dot(normal, lightDir), 0.0);
    let spec = pow(max(dot(reflect(-lightDir, normal), vec3<f32>(0.0,0.0,1.0)), 0.0), 32.0 * (1.0-roughness));
    
    let finalColor = albedo * (0.2 + 0.8 * diff) + vec3<f32>(spec);
    
    return vec4<f32>(finalColor, 1.0);
}
`

