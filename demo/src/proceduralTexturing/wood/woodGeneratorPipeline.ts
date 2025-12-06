import { grayscaleGenerationWGSL, colorApplicationWGSL, pbrMaterialWGSL } from './woodShaders'
import { getWebGPUDevice } from '../../utils/webgpu/webgpuDevice'
import type { PipelineData, PipelineDataMultiRecord } from '../../types/PipelineData.type'

export interface WoodParams {
    tileSize: number;
    ringScale: number;
    ringDistortion: number;
    knotIntensity: number;
    latewoodBias: number;
    rayStrength: number;
    poreDensity: number;

    gradientStops: { offset: number, color: string }[];

    fbmOctaves: number;
    fbmAmplitude: number;
    knotFrequency: number;
    distortionFreq: number;
    ringNoiseFreq: number;
    rayFrequencyX: number;
    rayFrequencyY: number;
    knotThresholdMin: number;
    knotThresholdMax: number;
    normalStrength: number;
    roughnessMin: number;
    roughnessMax: number;

    poreScale: number;
    poreThresholdEarly: number;
    poreThresholdLate: number;
    poreThresholdRange: number;
    poreStrength: number;
}

export const defaultWoodParams: WoodParams = {
    tileSize: 1.0,
    ringScale: 8.0,
    ringDistortion: 1.0,
    knotIntensity: 1.0,
    latewoodBias: 0.8,
    rayStrength: 0.6,
    poreDensity: 20.0,

    gradientStops: [
        { offset: 0.0, color: '#734F33' },
        { offset: 1.0, color: '#DCC8A9' }
    ],

    fbmOctaves: 3,
    fbmAmplitude: 0.5,
    knotFrequency: 0.8,
    distortionFreq: 1.5,
    ringNoiseFreq: 5.0,
    rayFrequencyX: 30.0,
    rayFrequencyY: 8.0,
    knotThresholdMin: 0.4,
    knotThresholdMax: 0.8,
    normalStrength: 8.0,
    roughnessMin: 0.35,
    roughnessMax: 0.7,

    poreScale: 1.0,             // 孔隙尺寸
    poreThresholdEarly: 0.45,   // 早材阈值降低，产生更多孔隙
    poreThresholdLate: 0.65,    // 晚材阈值降低
    poreThresholdRange: 0.15,   // 范围缩小，边缘更锐利
    poreStrength: 0.2,          // 强度从0.4降到0.2（因为着色器中乘以2.5）
}

// ============================================================
// 辅助函数
// ============================================================

function createGradientTexture(device: GPUDevice, stops: { offset: number, color: string }[]): GPUTexture {
    const width = 256;
    const height = 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
    sortedStops.forEach(stop => {
        gradient.addColorStop(stop.offset, stop.color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);

    const texture = device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    device.queue.writeTexture(
        { texture },
        imageData.data,
        { bytesPerRow: width * 4 },
        [width, height]
    );

    return texture;
}

function createFullscreenQuad(device: GPUDevice): GPUBuffer {
    const vertices = new Float32Array([
        -1, -1, 0, 0, 1,
        1, -1, 0, 1, 1,
        -1, 1, 0, 0, 0,
        -1, 1, 0, 0, 0,
        1, -1, 0, 1, 1,
        1, 1, 0, 1, 0,
    ]);
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    return vertexBuffer;
}

function createUniformBuffer(device: GPUDevice, params: WoodParams): GPUBuffer {
    const uniformData = new Float32Array(44);

    // Identity Matrix
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    // 核心参数
    uniformData[16] = params.tileSize;
    uniformData[17] = params.ringScale;
    uniformData[18] = params.ringDistortion;
    uniformData[19] = params.knotIntensity;
    uniformData[20] = params.latewoodBias;
    uniformData[21] = params.rayStrength;
    uniformData[22] = params.poreDensity;
    uniformData[23] = 0;

    // 高级参数
    uniformData[24] = params.fbmOctaves;
    uniformData[25] = params.fbmAmplitude;
    uniformData[26] = params.knotFrequency;
    uniformData[27] = params.distortionFreq;
    uniformData[28] = params.ringNoiseFreq;
    uniformData[29] = params.rayFrequencyX;
    uniformData[30] = params.rayFrequencyY;
    uniformData[31] = params.knotThresholdMin;
    uniformData[32] = params.knotThresholdMax;
    uniformData[33] = params.normalStrength;
    uniformData[34] = params.roughnessMin;
    uniformData[35] = params.roughnessMax;
    uniformData[36] = params.poreScale;
    uniformData[37] = params.poreThresholdEarly;
    uniformData[38] = params.poreThresholdLate;
    uniformData[39] = params.poreThresholdRange;
    uniformData[40] = params.poreStrength;

    uniformData[41] = 0;
    uniformData[42] = 0;
    uniformData[43] = 0;

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    return uniformBuffer;
}

async function textureToDataURL(device: GPUDevice, texture: GPUTexture, width: number, height: number): Promise<string> {
    const bytesPerPixel = 4;
    const unalignedBytesPerRow = width * bytesPerPixel;
    const align = 256;
    const bytesPerRow = Math.ceil(unalignedBytesPerRow / align) * align;

    const readBuffer = device.createBuffer({
        size: bytesPerRow * height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer(
        { texture },
        { buffer: readBuffer, bytesPerRow },
        [width, height]
    );
    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    const data = new Uint8Array(arrayBuffer);
    const imageData = ctx.createImageData(width, height);

    // 处理BGRA到RGBA的转换和padding移除
    for (let y = 0; y < height; y++) {
        const srcOffset = y * bytesPerRow;
        const dstOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
            const i = srcOffset + x * 4;
            const j = dstOffset + x * 4;
            imageData.data[j] = data[i + 2];     // R
            imageData.data[j + 1] = data[i + 1]; // G
            imageData.data[j + 2] = data[i];     // B
            imageData.data[j + 3] = data[i + 3]; // A
        }
    }

    ctx.putImageData(imageData, 0, 0);
    readBuffer.unmap();

    return canvas.toDataURL('image/png');
}

// ============================================================
// 管线步骤 1: 灰度生成
// ============================================================

async function generateGrayscale(
    device: GPUDevice,
    params: WoodParams,
    width: number,
    height: number
): Promise<{ grayscale: GPUTexture, structure: GPUTexture }> {
    // 创建两个渲染目标
    const grayscaleTexture = device.createTexture({
        size: [width, height],
        format: 'rgba16float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    const structureTexture = device.createTexture({
        size: [width, height],
        format: 'rgba16float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    // 创建资源
    const uniformBuffer = createUniformBuffer(device, params);
    const vertexBuffer = createFullscreenQuad(device);

    // 创建管线
    const module = device.createShaderModule({ code: grayscaleGenerationWGSL });
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x2' },
                ],
            }],
        },
        fragment: {
            module,
            entryPoint: 'fs_main',
            targets: [
                { format: 'rgba16float' }, // grayscale
                { format: 'rgba16float' }, // structure
            ],
        },
        primitive: { topology: 'triangle-list' },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
        ],
    });

    // 渲染
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: grayscaleTexture.createView(),
                loadOp: 'clear',
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                storeOp: 'store',
            },
            {
                view: structureTexture.createView(),
                loadOp: 'clear',
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                storeOp: 'store',
            },
        ],
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    return { grayscale: grayscaleTexture, structure: structureTexture };
}

// ============================================================
// 管线步骤 2: 颜色应用
// ============================================================

async function applyColor(
    device: GPUDevice,
    params: WoodParams,
    grayscaleTexture: GPUTexture,
    width: number,
    height: number
): Promise<GPUTexture> {
    const albedoTexture = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    const gradientTexture = createGradientTexture(device, params.gradientStops);
    const vertexBuffer = createFullscreenQuad(device);

    const textureSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    const gradientSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });

    const module = device.createShaderModule({ code: colorApplicationWGSL });
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x2' },
                ],
            }],
        },
        fragment: {
            module,
            entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }],
        },
        primitive: { topology: 'triangle-list' },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: grayscaleTexture.createView() },
            { binding: 1, resource: textureSampler },
            { binding: 2, resource: gradientTexture.createView() },
            { binding: 3, resource: gradientSampler },
        ],
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: albedoTexture.createView(),
            loadOp: 'clear',
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            storeOp: 'store',
        }],
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    return albedoTexture;
}

// ============================================================
// 管线步骤 3: PBR材质生成（可选）
// ============================================================

async function generateWoodPBR(
    device: GPUDevice,
    params: WoodParams,
    grayscaleTexture: GPUTexture,
    structureTexture: GPUTexture,
    width: number,
    height: number
): Promise<{ normal: GPUTexture, roughness: GPUTexture }> {
    const normalTexture = device.createTexture({
        size: [width, height],
        format: 'rgba16float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    const roughnessTexture = device.createTexture({
        size: [width, height],
        format: 'rgba16float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });

    // PBR uniform buffer (只需要3个参数)
    const uniformData = new Float32Array(4);
    uniformData[0] = params.normalStrength;
    uniformData[1] = params.roughnessMin;
    uniformData[2] = params.roughnessMax;
    uniformData[3] = 0; // padding

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    const vertexBuffer = createFullscreenQuad(device);
    const textureSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    const module = device.createShaderModule({ code: pbrMaterialWGSL });
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x2' },
                ],
            }],
        },
        fragment: {
            module,
            entryPoint: 'fs_main',
            targets: [
                { format: 'rgba16float' }, // normal
                { format: 'rgba16float' }, // roughness
            ],
        },
        primitive: { topology: 'triangle-list' },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: grayscaleTexture.createView() },
            { binding: 2, resource: structureTexture.createView() },
            { binding: 3, resource: textureSampler },
        ],
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: normalTexture.createView(),
                loadOp: 'clear',
                clearValue: { r: 0.5, g: 0.5, b: 1, a: 1 },
                storeOp: 'store',
            },
            {
                view: roughnessTexture.createView(),
                loadOp: 'clear',
                clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
                storeOp: 'store',
            },
        ],
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    return { normal: normalTexture, roughness: roughnessTexture };
}

// ============================================================
// 导出接口
// ============================================================

/**
 * 新的管线化接口 - 返回多个GPU纹理
 */
export async function generateWoodTexturePipeline(
    params: WoodParams,
    width: number,
    height: number,
    options: { includePBR?: boolean } = {}
): Promise<PipelineDataMultiRecord> {
    const device = await getWebGPUDevice();
    if (!device) {
        throw new Error('WebGPU not supported');
    }

    // Step 1: 生成灰度和结构
    const { grayscale, structure } = await generateGrayscale(device, params, width, height);

    // Step 2: 应用颜色
    const albedo = await applyColor(device, params, grayscale, width, height);

    const result: PipelineDataMultiRecord = {
        grayscale: {
            buffer: grayscale, // 临时类型转换
            width,
            height,
        },
        structure: {
            buffer: structure,
            width,
            height,
        },
        albedo: {
            buffer: albedo,
            width,
            height,
        },
    };

    // Step 3 (可选): 生成PBR材质
    if (options.includePBR) {
        const { normal, roughness } = await generateWoodPBR(device, params, grayscale, structure, width, height);
        result.normal = {
            buffer: normal,
            width,
            height,
        };
        result.roughness = {
            buffer: roughness,
            width,
            height,
        };
    }

    return result;
}

/**
 * 原有接口 - 保持向后兼容
 */
export async function generateWoodTexture(params: WoodParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice();
    if (!device) {
        throw new Error('WebGPU not supported');
    }

    const result = await generateWoodTexturePipeline(params, width, height, { includePBR: false });

    // 只导出albedo通道为Base64
    return textureToDataURL(device, result.albedo.buffer as unknown as GPUTexture, width, height);
}
