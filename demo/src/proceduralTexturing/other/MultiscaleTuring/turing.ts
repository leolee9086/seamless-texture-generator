/**
 * MultiscaleTuringParams
 * 多尺度激活-抑制图灵斑图参数
 */
export interface FilmGradeTuringParams {
    tileSize: number;
    simulationSteps: number;    // 迭代次数,建议 50-200

    // --- 多尺度激活-抑制模型核心参数 ---
    activatorRadius: number;    // 激活剂半径 (决定纹理主要宽度)
    inhibitorRadius: number;    // 抑制剂半径 (决定纹理间距)
    curvature: number;          // 曲率/变异性 (影响纹理的弯曲程度)

    // --- 各向异性扩散 (可选) ---
    diffusionAnisotropy: number;// 0.0 = 各向同性, 1.0 = 强拉伸
    flowDirection: number;      // 0 - 2π, 扩散流动方向

    // --- 空间变化 ---
    variationScale: number;     // 变异噪声频率
    variationStrength: number;  // 变异强度 (局部扰动半径)

    // --- 对比度调整 ---
    contrast: number;           // 对比度增强
    bias: number;               // 亮度偏移
}

// Common Utilities (Needed in both)
const commonUtils = /* wgsl */`
fn hash22(p: vec2<f32>) -> vec2<f32> {
    var p3 = fract(vec3<f32>(p.xyx) * vec3<f32>(.1031, .1030, .0973));
    p3 = p3 + dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// 周期性哈希函数 - 确保在周期边界处无缝衔接
fn hash22Periodic(p: vec2<f32>, period: vec2<f32>) -> vec2<f32> {
    let wrapped = ((p % period) + period) % period;
    var p3 = fract(vec3<f32>(wrapped.xyx) * vec3<f32>(.1031, .1030, .0973));
    p3 = p3 + dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

fn gradientNoise(p: vec2<f32>, scale: f32) -> f32 {
    let i = floor(p * scale);
    let f = fract(p * scale);
    let u = f * f * (3.0 - 2.0 * f);
    
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

// 周期性梯度噪声 - 在指定周期内无缝平铺
fn periodicGradientNoise(p: vec2<f32>, scale: f32, period: vec2<f32>) -> f32 {
    let scaledP = p * scale;
    let i = floor(scaledP);
    let f = fract(scaledP);
    let u = f * f * (3.0 - 2.0 * f);
    
    // 计算周期性网格坐标
    let periodScaled = period * scale;
    
    let i00 = ((i + vec2<f32>(0.0,0.0)) % periodScaled + periodScaled) % periodScaled;
    let i10 = ((i + vec2<f32>(1.0,0.0)) % periodScaled + periodScaled) % periodScaled;
    let i01 = ((i + vec2<f32>(0.0,1.0)) % periodScaled + periodScaled) % periodScaled;
    let i11 = ((i + vec2<f32>(1.0,1.0)) % periodScaled + periodScaled) % periodScaled;
    
    let g00 = hash22Periodic(i00, periodScaled) * 2.0 - 1.0;
    let g10 = hash22Periodic(i10, periodScaled) * 2.0 - 1.0;
    let g01 = hash22Periodic(i01, periodScaled) * 2.0 - 1.0;
    let g11 = hash22Periodic(i11, periodScaled) * 2.0 - 1.0;
    
    let val = mix(
        mix(dot(g00, f - vec2<f32>(0.0,0.0)), dot(g10, f - vec2<f32>(1.0,0.0)), u.x),
        mix(dot(g01, f - vec2<f32>(0.0,1.0)), dot(g11, f - vec2<f32>(1.0,1.0)), u.x),
        u.y);
    return 0.5 + 0.5 * val;
}

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
    return smoothstep(0.0, 0.4, minDist);
}


fn sampleBilinear(tex: texture_2d<f32>, uv: vec2<f32>) -> vec4<f32> {
    let dims = vec2<f32>(textureDimensions(tex));
    let st = uv * dims - 0.5;
    let iuv = floor(st);
    let fuv = fract(st);
    let dimi = vec2<i32>(dims);
    
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
`;

export const initTuringWGSL = commonUtils + /* wgsl */`

struct SimParams {
    actRadius: f32, inhRadius: f32,
    curvature: f32, anisotropy: f32,
    angle: f32, 
    varScale: f32, varStr: f32,
    seed: f32,
    padding1: f32, padding2: f32, padding3: f32
};

@group(0) @binding(0) var<uniform> sim : SimParams;
// Binding 1 skipped (inputTex not needed for init)
@group(0) @binding(2) var outputTex : texture_storage_2d<rgba32float, write>;

fn rotate(v: vec2<f32>, a: f32) -> vec2<f32> {
    let s = sin(a);
    let c = cos(a);
    return vec2<f32>(v.x * c - v.y * s, v.x * s + v.y * c);
}

@compute @workgroup_size(8, 8)
fn init_main(@builtin(global_invocation_id) id : vec3<u32>) {
    let dims = textureDimensions(outputTex);
    let coords = vec2<i32>(id.xy);
    if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) { return; }
    
    // 使用周期性噪声确保边界无缝衔接
    let uv = vec2<f32>(coords) / vec2<f32>(dims);
    let period = vec2<f32>(1.0, 1.0); // 周期为1.0（整个UV空间）
    
    // 使用周期性噪声替代普通噪声
    let n1 = periodicGradientNoise(uv + vec2<f32>(sim.seed), 8.0, period);
    let n2 = periodicGradientNoise(uv + vec2<f32>(sim.seed * 1.7), 16.0, period);
    let n = n1 * 0.6 + n2 * 0.4;
    // 保持初始值在0.3-0.7之间,避免极端值
    let centered = 0.5 + (n - 0.5) * 0.4;
    
    textureStore(outputTex, coords, vec4<f32>(centered, 0.0, 0.0, 1.0));
}
`;

export const turingComputeWGSL = commonUtils + /* wgsl */`

struct SimParams {
    actRadius: f32, inhRadius: f32,
    curvature: f32, anisotropy: f32,
    angle: f32, 
    varScale: f32, varStr: f32,
    seed: f32,
    padding1: f32, padding2: f32, padding3: f32
};

@group(0) @binding(0) var<uniform> sim : SimParams;
@group(0) @binding(1) var inputTex : texture_2d<f32>;
@group(0) @binding(2) var outputTex : texture_storage_2d<rgba32float, write>;

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

    let current = textureLoad(inputTex, coords, 0).r;
    let uv = vec2<f32>(coords) / vec2<f32>(dims);

    // 局部参数变异 - 使用周期性噪声
    let period = vec2<f32>(1.0, 1.0);
    let noiseVar = periodicGradientNoise(uv, sim.varScale, period);
    let localActR = sim.actRadius * (1.0 + (noiseVar - 0.5) * sim.varStr);
    let localInhR = sim.inhRadius * (1.0 - (noiseVar - 0.5) * sim.varStr);

    // 多点采样模拟高斯模糊
    var sumAct = 0.0;
    var sumInh = 0.0;
    let sampleCount = 32;
    let step = 6.28318 / f32(sampleCount);
    
    let rot = -sim.angle;
    let stretch = 1.0 + sim.anisotropy * 2.0;
    
    for(var i = 0; i < sampleCount; i++) {
        let angle = f32(i) * step;
        var offset = vec2<f32>(cos(angle), sin(angle));
        offset = rotate(offset, rot);
        offset.y *= stretch;

        let posAct = vec2<f32>(coords) + offset * localActR;
        let pAct = vec2<i32>(round(posAct));
        let dimi = vec2<i32>(dims);
        let wAct = ((pAct % dimi) + dimi) % dimi;
        sumAct += textureLoad(inputTex, wAct, 0).r;

        let posInh = vec2<f32>(coords) + offset * localInhR;
        let pInh = vec2<i32>(round(posInh));
        let wInh = ((pInh % dimi) + dimi) % dimi;
        sumInh += textureLoad(inputTex, wInh, 0).r;
    }

    let avgAct = sumAct / f32(sampleCount);
    let avgInh = sumInh / f32(sampleCount);

    var variation = avgAct - avgInh;
    
    // 使用极小步长和软约束
    let delta = variation * 0.02;
    let newVal = current + delta;
    
    // 使用tanh软约束保持灰度渐变
    // 注意: 这可能导致值非常接近0.5但不完全是0.5
    let bounded = 0.5 + 0.5 * tanh(2.0 * (newVal - 0.5));

    textureStore(outputTex, coords, vec4<f32>(bounded, abs(variation) * 10.0, 0.0, 1.0));
}
`;

// 新增: MinMax Calculation
export const minMaxComputeWGSL = /* wgsl */`
@group(0) @binding(0) var sourceTex : texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> minMax : array<atomic<i32>, 2>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id : vec3<u32>) {
    let dims = textureDimensions(sourceTex);
    if (id.x >= dims.x || id.y >= dims.y) { return; }
    
    let val = textureLoad(sourceTex, vec2<i32>(id.xy), 0).r;
    
    // Map float [0.0, 1.0] to int [0, 1000000] for atomic operations
    let valInt = i32(val * 1000000.0);
    
    atomicMin(&minMax[0], valInt);
    atomicMax(&minMax[1], valInt);
}
`;


export const turingRenderWGSL = commonUtils + /* wgsl */`
struct RenderUniforms {
    tileSize : f32,
    contrast: f32, 
    bias: f32,
    padding1: f32
};

@group(0) @binding(0) var<uniform> u : RenderUniforms;
@group(0) @binding(1) var simTex : texture_2d<f32>;
@group(0) @binding(2) var smp : sampler;
// 自动范围归一化
@group(0) @binding(3) var<storage, read> minMaxBuf : array<i32, 2>;

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
    
    // 调试：输出模拟的变化量 (G通道存储的是 abs(variation) * 10.0)
    // 如果这个也是纯色，说明模拟算法本身有问题
    let variation = simData.g;
    
    // 同时也输出 R 通道（实际的图灵斑纹）
    let pattern = simData.r;
    
    // 先输出 variation 来调试，如果看到变化，再切回 pattern
    return vec4<f32>(variation, variation, variation, 1.0);
}
`;

export const turingMaterialWGSL = commonUtils + /* wgsl */`
struct MaterialUniforms {
    tileSize : f32,
    contrast: f32, 
    bias: f32,
    padding1: f32
};

@group(0) @binding(0) var<uniform> u : MaterialUniforms;
@group(0) @binding(1) var grayTex : texture_2d<f32>;  // 读取灰度图
@group(0) @binding(2) var smp : sampler;
@group(0) @binding(3) var<storage, read> minMaxBuf : array<i32, 2>; // Just for layout compatibility

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
    // 1. Just sample the gray texture
    let dims = vec2<f32>(textureDimensions(grayTex));
    let coords = vec2<i32>(in.uv * dims);
    let gray = textureLoad(grayTex, coords, 0).r;
    
    // Passthrough
    return vec4<f32>(gray, gray, gray, 1.0);
}
`;
