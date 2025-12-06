/**
 * FilmGradeTuringParams
 * 影视级生物纹理生成参数
 */
export interface FilmGradeTuringParams {
    tileSize: number;
    simulationSteps: number;    // 建议 3000+

    // --- 1. 图灵反应堆 (Reaction Core) ---
    // 使用各向异性扩散模拟毛发流向对色素的影响
    feedRate: number;           // 0.03 - 0.06
    killRate: number;           // 0.055 - 0.065
    diffusionAnisotropy: number;// 0.0 = 各向同性, 1.0 = 强拉伸 (模拟毛流)
    flowDirection: number;      // 0 - 2PI, 扩散流动的角度

    // --- 2. 混沌与变异 (Chaos & Mutation) ---
    // 控制花纹在身体不同部位的自然变化
    patternScale: number;       // 花纹大小
    variationScale: number;     // 变异噪声频率
    variationStrength: number;  // 变异强度

    // --- 3. 皮肤微观结构 (Micro-Dermis) ---
    // 影视级的关键：毛孔与皮纹
    poreDensity: number;        // 毛孔密度
    poreDepth: number;          // 毛孔深度
    skinWrinkleScale: number;   // 皮纹缩放
    skinWrinkleStrength: number;// 皮纹强度

    // --- 4. 多层色素材质 (Layered Material) ---
    // 模拟生物组织的半透明感
    subsurfaceColor: string;    // 真皮层颜色 (透光色)
    epidermisColor: string;     // 表皮层底色
    pigmentColor: string;       // 色素层颜色 (花纹)

    // --- 5. 光照响应 (Light Response) ---
    roughnessBase: number;      // 皮肤基础粗糙度
    roughnessPigment: number;   // 色素区域粗糙度 (通常更光滑或更粗糙)
    normalDetail: number;       // 法线微观细节强度
    heightDisplacement: number; // 置换贴图强度
}

export const filmGradeTuringShaderWGSL = /* wgsl */`

// ==========================================
// 1. Utilities: High-Quality Noise
// ==========================================

fn hash33(p3: vec3<f32>) -> vec3<f32> {
    var p = fract(p3 * vec3<f32>(.1031, .1030, .0973));
    p = p + dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

fn hash22(p: vec2<f32>) -> vec2<f32> {
    var p3 = fract(vec3<f32>(p.xyx) * vec3<f32>(.1031, .1030, .0973));
    p3 = p3 + dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// 梯度噪声 (用于微观皮纹)
fn gradientNoise(p: vec2<f32>, scale: f32) -> f32 {
    let i = floor(p * scale);
    let f = fract(p * scale);
    let u = f * f * (3.0 - 2.0 * f);
    
    // 伪随机梯度方向
    let g00 = hash22(i + vec2<f32>(0.0,0.0)) * 2.0 - 1.0;
    let g10 = hash22(i + vec2<f32>(1.0,0.0)) * 2.0 - 1.0;
    let g01 = hash22(i + vec2<f32>(0.0,1.0)) * 2.0 - 1.0;
    let g11 = hash22(i + vec2<f32>(1.0,1.0)) * 2.0 - 1.0;
    
    let val = mix(
        mix(dot(g00, f - vec2<f32>(0.0,0.0)), dot(g10, f - vec2<f32>(1.0,0.0)), u.x),
        mix(dot(g01, f - vec2<f32>(0.0,1.0)), dot(g11, f - vec2<f32>(1.0,1.0)), u.x),
        u.y);
    return 0.5 + 0.5 * val;
}

// Voronoi (用于毛孔)
fn voronoi(uv: vec2<f32>, density: f32) -> f32 {
    let p = uv * density;
    let i = floor(p);
    let f = fract(p);
    
    var minDist = 1.0;
    
    for(var y=-1; y<=1; y++) {
        for(var x=-1; x<=1; x++) {
            let neighbor = vec2<f32>(f32(x), f32(y));
            let point = hash22(i + neighbor);
            let diff = neighbor + point - f;
            let dist = length(diff);
            minDist = min(minDist, dist);
        }
    }
    // 反转，使得中心是孔洞
    return smoothstep(0.0, 0.4, minDist);
}

fn sampleBilinear(tex: texture_2d<f32>, uv: vec2<f32>) -> vec4<f32> {
    let dims = vec2<f32>(textureDimensions(tex));
    // Manual repeat wrap equivalent
    let st = uv * dims - 0.5;
    let iuv = floor(st);
    let fuv = fract(st);

    let dimi = vec2<i32>(dims);
    
    // Helper for wrapping modulo with negative numbers handling
    // ((a % n) + n) % n
    let p00_raw = vec2<i32>(iuv);
    let p10_raw = p00_raw + vec2<i32>(1, 0);
    let p01_raw = p00_raw + vec2<i32>(0, 1);
    let p11_raw = p00_raw + vec2<i32>(1, 1);

    let c00 = ((p00_raw % dimi) + dimi) % dimi;
    let c10 = ((p10_raw % dimi) + dimi) % dimi;
    let c01 = ((p01_raw % dimi) + dimi) % dimi;
    let c11 = ((p11_raw % dimi) + dimi) % dimi;

    let v00 = textureLoad(tex, c00, 0);
    let v10 = textureLoad(tex, c10, 0);
    let v01 = textureLoad(tex, c01, 0);
    let v11 = textureLoad(tex, c11, 0);

    return mix(
        mix(v00, v10, fuv.x),
        mix(v01, v11, fuv.x),
        fuv.y
    );
}

// ==========================================
// 2. Compute Shader: Anisotropic Reaction-Diffusion
// ==========================================

struct SimParams {
    feed: f32, kill: f32,
    anisotropy: f32, angle: f32,
    varScale: f32, varStr: f32,
    dt: f32, seed: f32,
    padding1: f32, padding2: f32
};

@group(0) @binding(0) var<uniform> sim : SimParams;
@group(0) @binding(1) var inputTex : texture_2d<f32>;
@group(0) @binding(2) var outputTex : texture_storage_2d<rgba32float, write>;

// 旋转向量
fn rotate(v: vec2<f32>, a: f32) -> vec2<f32> {
    let s = sin(a);
    let c = cos(a);
    return vec2<f32>(v.x * c - v.y * s, v.x * s + v.y * c);
}

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3<u32>) {
    let dims = textureDimensions(inputTex);
    let coords = vec2<i32>(id.xy);
    if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) { return; }

    let uv = vec2<f32>(coords) / vec2<f32>(dims);

    // 读取上一帧
    let val = textureLoad(inputTex, coords, 0);
    var a = val.r;
    var b = val.g;

    // --- 空间参数变化 (Spatial Variation) ---
    // 使用低频噪声调节 Feed/Kill，模拟生物体不同部位的差异
    let noiseVar = gradientNoise(uv, sim.varScale);
    let localFeed = sim.feed + (noiseVar - 0.5) * sim.varStr * 0.02;
    let localKill = sim.kill - (noiseVar - 0.5) * sim.varStr * 0.01;

    // --- 各向异性拉普拉斯卷积 (Authorized Anisotropic Laplacian) ---
    // With normalization fix
    var lapA = 0.0;
    var lapB = 0.0;
    var weightSum = 0.0;
    
    // 构建各向异性权重核
    let rot = -sim.angle;
    let centerA = a;
    let centerB = b;

    for(var i=-1; i<=1; i++) {
        for(var j=-1; j<=1; j++) {
            if (i==0 && j==0) { continue; }

            // Periodic wrap
            var nx = coords.x + i;
            var ny = coords.y + j;
            if(nx < 0) { nx = i32(dims.x)-1; } if(nx >= i32(dims.x)) { nx = 0; }
            if(ny < 0) { ny = i32(dims.y)-1; } if(ny >= i32(dims.y)) { ny = 0; }
            
            let neighbor = textureLoad(inputTex, vec2<i32>(nx, ny), 0);
            
            // 计算权重
            let offset = vec2<f32>(f32(i), f32(j));
            var weight = 0.0;
            
            // 将邻居坐标旋转到流场空间
            let localPos = rotate(offset, rot);
            // 距离权衡: 
            let stretch = 1.0 + sim.anisotropy * 3.0;
            let distSq = localPos.x*localPos.x + (localPos.y*localPos.y * stretch);
            
            // 基于距离的高斯权重近似
            weight = exp(-distSq * 2.0); 

            weightSum += weight;
            lapA += neighbor.r * weight;
            lapB += neighbor.g * weight;
        }
    }

    // 归一化 Laplacian
    if (weightSum > 0.0) {
        lapA = (lapA / weightSum) - centerA;
        lapB = (lapB / weightSum) - centerB;
    } else {
        lapA = 0.0;
        lapB = 0.0;
    }

    // Gray-Scott Reaction
    // 使用标准参数
    let diffRateA = 1.0;
    let diffRateB = 0.5;

    let reaction = a * b * b;
    let newA = a + (diffRateA * lapA - reaction + localFeed * (1.0 - a)) * sim.dt;
    let newB = b + (diffRateB * lapB + reaction - (localKill + localFeed) * b) * sim.dt;

    textureStore(outputTex, coords, vec4<f32>(clamp(newA, 0.0, 1.0), clamp(newB, 0.0, 1.0), 0.0, 1.0));
}

// ==========================================
// 3. Render Shader: Film-Grade Materialization
// ==========================================

struct RenderUniforms {
    viewMatrix : mat4x4<f32>, // Unused
    
    colorSub : vec3<f32>,
    colorEpi : vec3<f32>,
    colorPig : vec3<f32>,
    
    tileSize : f32,
    poreDensity : f32,
    poreDepth : f32,
    wrinkleScale : f32,
    wrinkleStr : f32,
    
    roughBase : f32,
    roughPig : f32,
    normDetail : f32,
    dispStr : f32,
    
    padding1: f32, padding2: f32 
};

@group(0) @binding(0) var<uniform> u : RenderUniforms;
@group(0) @binding(1) var simTex : texture_2d<f32>;
@group(0) @binding(2) var smp : sampler;

struct VertexOutput {
    @builtin(position) Pos : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

@vertex
fn vs_main(@location(0) pos : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var out : VertexOutput;
    out.Pos = vec4<f32>(pos, 1.0);
    out.uv = uv;
    return out;
}

// 复合高度场计算 (Macro + Micro)
fn getSurfaceHeight(uv: vec2<f32>) -> vec3<f32> {
    let macroUV = uv * u.tileSize;
    
    // 1. 宏观花纹 (来自图灵模拟)
    // 采用双三次插值或平滑插值会更好，这里用线性
    let chem = sampleBilinear(simTex, macroUV);
    // B 是色素浓度
    // 调宽范围以适应不同的反应结果
    let patternMask = smoothstep(0.001, 0.6, chem.g);
    
    // 2. 微观细节 (程序化生成)
    // 皮纹 (Wrinkles)
    let wrinkles = gradientNoise(macroUV, u.wrinkleScale);
    // 毛孔 (Pores) - 只有在皮肤区域比较明显，色素区域可能被覆盖
    let pores = voronoi(macroUV, u.poreDensity);
    
    // 组合微观高度
    // 毛孔是凹陷 (-), 皮纹是起伏 (+/-)
    let microHeight = (wrinkles - 0.5) * u.wrinkleStr - (1.0 - pores) * u.poreDepth;
    
    // 3. 总高度
    // 假设色素区域略微隆起 (如疤痕或厚皮) 或者凹陷，取决于物种
    // 这里假设色素区域略微隆起
    let baseHeight = patternMask * u.dispStr;
    
    let totalHeight = clamp(baseHeight + microHeight, 0.0, 1.0);
    
    return vec3<f32>(totalHeight, patternMask, microHeight);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
    let macroUV = in.uv * u.tileSize;
    
    // 直接采样模拟结果
    let chem = sampleBilinear(simTex, macroUV);
    
    // 使用 G 通道 (色素浓度) 作为输出
    let val = chem.g;
    
    return vec4<f32>(val, val, val, 1.0);
}
`;