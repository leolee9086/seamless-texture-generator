/**
 * GrayScottTuringParams
 * Gray-Scott反应扩散系统参数
 * 专注于图灵斑图生成
 */
export interface FilmGradeTuringParams {
    tileSize: number;
    simulationSteps: number;    // 模拟迭代次数,建议 2000+

    // --- Gray-Scott反应扩散核心参数 ---
    feedRate: number;           // 供给率 F: 0.01 - 0.10
    killRate: number;           // 消耗率 K: 0.03 - 0.07

    // --- 各向异性扩散 (可选) ---
    diffusionAnisotropy: number;// 0.0 = 各向同性, 1.0 = 强各向异性
    flowDirection: number;      // 0 - 2π, 扩散流动方向

    // --- 空间变化 ---
    variationScale: number;     // 变异噪声频率
    variationStrength: number;  // 变异强度,控制F/K的空间差异
}

export const filmGradeTuringShaderWGSL = /* wgsl */`

// ==========================================
// 1. 辅助函数: 梯度噪声
// ==========================================

fn hash22(p: vec2<f32>) -> vec2<f32> {
    var p3 = fract(vec3<f32>(p.xyx) * vec3<f32>(.1031, .1030, .0973));
    p3 = p3 + dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// 梯度噪声 (用于空间变化)
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
// 3. 渲染Shader: 简单灰度输出
// ==========================================

struct RenderUniforms {
    tileSize : f32,
    padding1: f32,
    padding2: f32, 
    padding3: f32
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

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
    let dims = vec2<f32>(textureDimensions(simTex));
    let coords = vec2<i32>(in.uv * dims);
    let simData = textureLoad(simTex, coords, 0);
    
    // 直接输出化学物质 B 的浓度 (G通道)
    let val = simData.g;
    
    return vec4<f32>(val, val, val, 1.0);
}
`;