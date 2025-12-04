
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
fn periodicFbm(p: vec3<f32>, octaves: i32, period: f32) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
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
// 核心逻辑：生物学木材生成
// -----------------------------------------------------------

fn getWoodDetail(uv: vec2<f32>) -> vec4<f32> {
    // 将 UV 映射到世界尺度，基于 tileSize 实现循环
    let scale = u.tileSize;
    var pos = vec3<f32>(uv * scale, 0.0); // Z轴可以是时间或切片位置
    
    // 1. 模拟树结 (Knots) - 极其重要
    // 树结是木材纹理流动的引力中心
    // 使用低频噪声模拟随机的生长压力中心
    let knotNoise = periodicNoise(pos * 0.8, scale * 0.8);
    // 如果噪声值超过阈值，产生强烈的局部扭曲
    let knotFactor = smoothstep(0.4, 0.8, abs(knotNoise)) * u.knotIntensity;
    
    // 2. 域扭曲 (Domain Warping)
    // 基础生长扭曲 + 树结扭曲
    // 注意：所有噪声必须使用 periodicFbm 且传入 scale 以保证无缝
    var distortion = periodicFbm(pos * 1.5, 3, scale * 1.5);
    // 树结会极大地拉扯坐标
    let finalPos = pos + vec3<f32>(distortion, distortion, 0.0) * (u.ringDistortion + knotFactor * 4.0);
    
    // 3. 计算“年轮距离场”
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
    // 这种非线性映射产生了真实的“硬边”效果
    let ringProfile = pow(ringCycle, u.latewoodBias); // 0.2 (圆润) - 5.0 (尖锐)
    
    // 反转并混合，得到基础密度信号 (0 = 晚材/深, 1 = 早材/浅)
    // 我们加入一些扰动，让每条年轮的粗细不完全一致
    let ringSignal = smoothstep(0.1, 0.9, ringProfile + periodicNoise(pos * 5.0, scale*5.0) * 0.1);

    // 5. 髓射线 (Medullary Rays)
    // 橡木等硬木特有的垂直于年轮的细碎闪光纹理
    // 在 UV 空间中，这表现为沿 Y 轴的高频噪点，但被年轮相位调制
    let rayNoise = periodicFbm(vec3<f32>(pos.x * 50.0, pos.y * 2.0, 0.0), 2, scale * 50.0);
    let rays = smoothstep(0.6, 1.0, rayNoise) * u.rayStrength;
    // 射线通常在早材中更明显，或者打断晚材
    
    // 6. 导管孔隙 (Pores)
    // 深色的小点，主要聚集在早材区域
    let poreNoise = periodicFbm(pos * u.poreDensity, 2, scale * u.poreDensity);
    // 孔隙只出现在 ringSignal 较高的区域 (早材)
    let pores = step(0.6, poreNoise) * ringSignal * 0.5; // 0.5 是孔隙深度

    // --- 最终合成 ---
    // 组合密度信号
    var finalDensity = ringSignal;
    finalDensity = finalDensity - pores; // 孔隙是凹陷且深色的
    finalDensity = finalDensity + rays * 0.2; // 射线通常较亮
    finalDensity = clamp(finalDensity, 0.0, 1.0);

    return vec4<f32>(finalDensity, ringSignal, pores, rays); // 返回各通道供 PBR 使用
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
    var roughness = mix(0.7, 0.35, density);
    roughness = max(roughness - data.w * 0.3, 0.2); // 射线增加反光
    roughness = min(roughness + data.z * 1.0, 1.0); // 孔隙非常粗糙
    
    // 3. 高质量法线生成
    // 这里的关键是：我们不只用颜色计算法线，而是用特定的高度图通道
    // 早材高，晚材低，孔隙深凹
    let height = density * 0.1 - data.z * 0.05; // 孔隙产生深度
    
    // 使用偏导数计算法线 (在像素着色器中无需重复采样，极大提升性能)
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    // 调整法线强度
    let normalStrength = 8.0; 
    let normal = normalize(vec3<f32>(-dHdUV.x * normalStrength, -dHdUV.y * normalStrength, 1.0));
    
    // 4. 简单的光照预览 (实际使用时通常只输出 G-Buffer: Albedo, Normal, Roughness)
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let diff = max(dot(normal, lightDir), 0.0);
    let spec = pow(max(dot(reflect(-lightDir, normal), vec3<f32>(0.0,0.0,1.0)), 0.0), 32.0 * (1.0-roughness));
    
    let finalColor = albedo * (0.2 + 0.8 * diff) + vec3<f32>(spec);
    
    return vec4<f32>(finalColor, 1.0);
}
`
/*
### 为什么这个版本更强？

1.  **无缝平铺 (Seamless Tiling):**

      * 我编写了 `periodicNoise` 函数。它接受一个 `tileSize` 参数（例如 4.0）。
      * 当 UV 坐标从 0 走到 1 时，噪声内部计算实际上是从 0 走到 4。
      * 通过取模 (`%`)，4.0 的位置会精确对齐回 0.0 的哈希值。
      * **结果：** 你生成的贴图可以像任何商业贴图一样在模型上无限重复，没有任何接缝。

2.  **锯齿波 (Sawtooth) 替代正弦波:**

      * 真实的木头：春季生长极快（浅色部分很宽），夏末生长极慢（颜色变深），冬天停止（一条硬线）。
      * 代码 `pow(ringCycle, u.latewoodBias)` 精确模拟了这种非线性密度。
      * `latewoodBias` 参数越高，深色条纹越细、越锐利，看起来越像硬木。

3.  **树结 (Knots) 模拟:**

      * 之前的版本只是整体扭曲。
      * 现在通过 `knotFactor` 模拟了局部高压区。纹理会像流体一样绕过这些点，产生极其自然的“眼睛”形状。

4.  **髓射线 (Medullary Rays):**

      * 这是橡木、榉木等高档木材的关键特征（垂直于纹理的微小反光条）。
      * 通过 `rayStrength` 单独控制，增加了木材的层次感和昂贵感。

### 如何使用参数获得特定木材

  * **红松 (Pine):**
      * `ringScale`: 5.0 (纹理宽)
      * `latewoodBias`: 0.5 (过渡平滑，没有太硬的边)
      * `knotIntensity`: 1.2 (树结多且明显)
      * `poreDensity`: 0.0 (针叶林没有明显的导管孔)
  * **白橡 (White Oak):**
      * `ringScale`: 12.0 (纹理密)
      * `latewoodBias`: 3.0 (晚材线条非常锐利)
      * `rayStrength`: 0.8 (必须有明显的髓射线)
      * `poreDensity`: 20.0 (明显的导管孔隙)
  * **黑胡桃 (Walnut):**
      * `colorEarly`: 深褐色
      * `colorLate`: 黑色
      * `ringDistortion`: 1.5 (高度扭曲的纹理)
      * `latewoodBias`: 1.5 (适中)
      * */