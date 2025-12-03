
import type { HSLAdjustmentLayer } from './hslAdjustStep'

export interface ExposureAdjustmentParams {
  strength: number
  targetExposure: number
  localAdjustFactor: number
}

export interface ExposureHistogramData {
  brightness: Uint32Array
  totalPixels: number
}

// WebGPU 着色器代码
const autoExposureShader = `
struct Uniforms {
    width: u32,
    height: u32,
    strength: f32,
    targetExposure: f32,
    localAdjustFactor: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<storage, read> histogram: array<u32, 256>;
@group(0) @binding(4) var<storage, read> cdf: array<f32, 256>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pixel_coord = vec2<i32>(global_id.xy);
    if (pixel_coord.x >= i32(uniforms.width) || pixel_coord.y >= i32(uniforms.height)) {
        return;
    }

    let color = textureLoad(inputTexture, pixel_coord, 0);
    let luminance = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
    
    let luminanceDiff = abs(luminance - 0.5) * 2.0;
    let luminanceIndex = u32(luminance * 255.0);
    
    let protectionFactor = sqrt(luminanceDiff);
    let targetBaseLuminance = cdf[luminanceIndex];
    let targetLuminance = mix(targetBaseLuminance, luminance, protectionFactor);
    
    let sigmoid = 1.0 / (1.0 + exp(-8.0 * (luminance - 0.5)));
    let adjustmentStrength = 0.5 + sigmoid * 0.5;
    
    let baseLuminanceAdjust = uniforms.strength * (targetLuminance - luminance + uniforms.targetExposure);
    let luminanceAdjust = baseLuminanceAdjust * adjustmentStrength;
    
    let adjustmentFactor = 1.0 + (uniforms.localAdjustFactor * 0.2);
    let fineAdjust = luminanceAdjust * adjustmentFactor;
    
    let baseLimit = 45.0 / 255.0;
    let dynamicLimit = baseLimit * (1.0 - luminanceDiff * luminanceDiff);
    let limitedAdjust = clamp(fineAdjust, -dynamicLimit, dynamicLimit);
    
    let newColor = clamp(color.rgb + vec3<f32>(limitedAdjust), vec3<f32>(0.0), vec3<f32>(1.0));
    textureStore(outputTexture, pixel_coord, vec4<f32>(newColor, color.a));
}
`

// 资源池类，用于管理GPU资源
class ResourcePool {
    private device: GPUDevice
    private buffers = new Map<string, WeakRef<GPUBuffer>>()
    private textures = new Map<string, WeakRef<GPUTexture>>()
    private mappedBuffers = new Set<GPUBuffer>()
    private registry = new FinalizationRegistry(this.cleanup.bind(this))

    constructor(device: GPUDevice) {
        this.device = device
    }

    async getBuffer(size: number, usage: GPUBufferUsageFlags, label = ''): Promise<GPUBuffer> {
        const key = `${size}_${usage}_${label}`
        let buffer: GPUBuffer | undefined

        if (this.buffers.has(key)) {
            const bufferRef = this.buffers.get(key)!
            buffer = bufferRef.deref()

            if (buffer) {
                // 如果缓冲区已映射，尝试取消映射
                if (this.mappedBuffers.has(buffer)) {
                    try {
                        buffer.unmap()
                        this.mappedBuffers.delete(buffer)
                    } catch (e) {
                        // 忽略未映射缓冲区的错误
                    }
                }
                return buffer
            }
        }

        // 创建新的缓冲区
        buffer = this.device.createBuffer({
            size,
            usage,
            label: `pool_buffer_${label}`
        })

        this.buffers.set(key, new WeakRef(buffer))
        this.registry.register(buffer, {
            type: 'buffer',
            key
        })

        return buffer
    }

    markBufferMapped(buffer: GPUBuffer): void {
        this.mappedBuffers.add(buffer)
    }

    markBufferUnmapped(buffer: GPUBuffer): void {
        this.mappedBuffers.delete(buffer)
    }

    getTexture(width: number, height: number, format: GPUTextureFormat, usage: GPUTextureUsageFlags, label = ''): GPUTexture {
        const key = `${width}_${height}_${format}_${usage}_${label}`
        if (!this.textures.has(key)) {
            const texture = this.device.createTexture({
                size: [width, height],
