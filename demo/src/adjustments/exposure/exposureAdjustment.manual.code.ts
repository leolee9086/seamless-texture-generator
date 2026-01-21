/**
 * 手动曝光调整 WebGPU 着色器
 * 直接在 GPUBuffer (RGBA8) 上操作，避免 GPU↔CPU 往返
 */
export const 手动曝光着色器代码 = /* wgsl */`
struct ExposureParams {
    exposure: f32,     // 曝光值 (默认 1.0)
    contrast: f32,     // 对比度 (默认 1.0)
    gamma: f32,        // 伽马值 (默认 1.0)
    像素总数: u32,     // width * height
}

@group(0) @binding(0) var<uniform> params: ExposureParams;
@group(0) @binding(1) var<storage, read> 输入: array<u32>;
@group(0) @binding(2) var<storage, read_write> 输出: array<u32>;

// 从 u32 (RGBA8) 解包为 vec4<f32> (0-1范围)
fn 解包RGBA(packed: u32) -> vec4<f32> {
    let r = f32(packed & 0xFFu) / 255.0;
    let g = f32((packed >> 8u) & 0xFFu) / 255.0;
    let b = f32((packed >> 16u) & 0xFFu) / 255.0;
    let a = f32((packed >> 24u) & 0xFFu) / 255.0;
    return vec4<f32>(r, g, b, a);
}

// 将 vec4<f32> 打包为 u32 (RGBA8)
fn 打包RGBA(color: vec4<f32>) -> u32 {
    let r = u32(clamp(color.r * 255.0, 0.0, 255.0));
    let g = u32(clamp(color.g * 255.0, 0.0, 255.0));
    let b = u32(clamp(color.b * 255.0, 0.0, 255.0));
    let a = u32(clamp(color.a * 255.0, 0.0, 255.0));
    return r | (g << 8u) | (b << 16u) | (a << 24u);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    if (idx >= params.像素总数) {
        return;
    }

    // 读取像素
    let 原始颜色 = 解包RGBA(输入[idx]);
    var r = 原始颜色.r;
    var g = 原始颜色.g;
    var b = 原始颜色.b;
    let a = 原始颜色.a;

    // 1. 应用曝光
    r = r * params.exposure;
    g = g * params.exposure;
    b = b * params.exposure;

    // 2. 应用对比度 (以 0.5 为中心)
    r = (r - 0.5) * params.contrast + 0.5;
    g = (g - 0.5) * params.contrast + 0.5;
    b = (b - 0.5) * params.contrast + 0.5;

    // 3. 应用伽马校正 (使用 1/gamma)
    let invGamma = 1.0 / params.gamma;
    r = pow(max(r, 0.0), invGamma);
    g = pow(max(g, 0.0), invGamma);
    b = pow(max(b, 0.0), invGamma);

    // 输出
    let 结果颜色 = vec4<f32>(
        clamp(r, 0.0, 1.0),
        clamp(g, 0.0, 1.0),
        clamp(b, 0.0, 1.0),
        a
    );
    输出[idx] = 打包RGBA(结果颜色);
}
`

/** 着色器别名导出 */
export const manualExposureShader = 手动曝光着色器代码
