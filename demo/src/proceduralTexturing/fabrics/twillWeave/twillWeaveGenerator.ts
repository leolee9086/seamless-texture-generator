import { twillWeaveShaderWGSL, TwillWeaveParams } from './twillWeave'
import { getWebGPUDevice } from '../../../utils/webgpu/deviceCache/webgpuDevice'

// 默认参数：经典牛仔布 (3/1 右斜纹)
export const defaultTwillWeaveParams: TwillWeaveParams = {
    tileSize: 1.0,
    threadDensity: 40.0,        // 牛仔布密度较高
    threadThickness: 0.8,       // 纱线饱满，覆盖度高
    warpWeftRatio: 1.0,

    // 纱线结构
    threadTwist: 0.7,           // 强捻纱
    fiberDetail: 0.4,
    fuzziness: 0.3,             // 棉质感

    // 斜纹特征
    twillRepeat: 4.0,           // 3/1 结构 (3上1下) -> 周期为4
    herringboneScale: 0.0,      // 0 = 普通斜纹，设置为 10.0+ 变成人字纹
    waleDepth: 1.2,             // 明显的斜向纹路

    // 织造特征
    weaveTightness: 0.85,       // 非常紧密
    threadUnevenness: 0.2,      // 竹节棉效果 (Slub)
    weaveImperfection: 0.15,

    // 颜色渐变 - 靛蓝牛仔
    // 0.0 (Gap/Shadow/Weft) -> 1.0 (Warp Surface)
    gradientStops: [
        { offset: 0.0, color: '#1a1a2e' }, // 深色阴影
        { offset: 0.3, color: '#e0e0d0' }, // 纬线 (Weft) 通常是未染色的原白
        { offset: 0.6, color: '#2c3e50' }, // 经线 (Warp) 深蓝
        { offset: 1.0, color: '#34495e' }  // 经线高光部分
    ],

    // 高级参数
    fbmOctaves: 4,
    fbmAmplitude: 0.4,
    noiseFrequency: 3.0,        // 模拟水洗/磨损的频率
    colorVariation: 0.15,       // 色差明显 (牛仔布特征)

    // 光泽和材质
    warpSheen: 0.4,             // 靛蓝纱线有淀粉/树脂光泽
    weftSheen: 0.1,             // 棉纱无光
    roughnessMin: 0.5,
    roughnessMax: 0.9,
    normalStrength: 8.0,        // 强调纹理深度

    threadHeightScale: 1.2,
    threadShadowStrength: 0.6,  // 强烈的自身阴影
}

function createGradientTexture(device: GPUDevice, stops: { offset: number, color: string }[]): GPUTexture {
    const width = 256;
    const height = 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    // Sort stops just in case
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

export async function generateTwillWeaveTexture(params: TwillWeaveParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice()
    if (!device) {
        throw new Error('WebGPU not supported')
    }

    const texture = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    })

    // Uniform buffer calculations
    // 16 floats (mat4)
    // + 8 floats (core params)
    // + 4 floats (twill specific)
    // + 4 floats (weave details)
    // + 4 floats (advanced noise)
    // + 8 floats (material + padding)
    // Need to carefully map to the struct padding

    // Struct layout from shader:
    // mat4 viewMatrix (0-15)
    // f32 tileSize (16)
    // f32 threadDensity (17)
    // f32 threadThickness (18)
    // f32 warpWeftRatio (19)
    // f32 threadTwist (20)
    // f32 fiberDetail (21)
    // f32 fuzziness (22)
    // f32 twillRepeat (23) <-- New
    // f32 herringboneScale (24) <-- New
    // f32 waleDepth (25) <-- New
    // f32 padding1 (26)
    // f32 weaveTightness (27)
    // f32 threadUnevenness (28)
    // f32 weaveImperfection (29)
    // f32 fbmOctaves (30) <-- Adjusted index
    // f32 fbmAmplitude (31)
    // f32 noiseFrequency (32)
    // f32 colorVariation (33)
    // f32 warpSheen (34)
    // f32 weftSheen (35)
    // f32 roughnessMin (36)
    // f32 roughnessMax (37)
    // f32 normalStrength (38)
    // f32 threadHeightScale (39)
    // f32 threadShadowStrength (40)
    // f32 padding2 (41)

    // Total 42 floats -> 168 bytes. Round up to align 16 bytes? 176 bytes (44 floats).

    const uniformCount = 44;
    const uniformData = new Float32Array(uniformCount);

    // Identity Matrix
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    // Core
    uniformData[16] = params.tileSize;
    uniformData[17] = params.threadDensity;
    uniformData[18] = params.threadThickness;
    uniformData[19] = params.warpWeftRatio;

    uniformData[20] = params.threadTwist;
    uniformData[21] = params.fiberDetail;
    uniformData[22] = params.fuzziness;

    // Twill Specific
    uniformData[23] = params.twillRepeat;
    uniformData[24] = params.herringboneScale;
    uniformData[25] = params.waleDepth;
    uniformData[26] = 0; // padding1

    // Weave
    uniformData[27] = params.weaveTightness;
    uniformData[28] = params.threadUnevenness;
    uniformData[29] = params.weaveImperfection;

    // Advanced
    uniformData[30] = params.fbmOctaves;
    uniformData[31] = params.fbmAmplitude;
    uniformData[32] = params.noiseFrequency;
    uniformData[33] = params.colorVariation;

    // Material
    uniformData[34] = params.warpSheen;
    uniformData[35] = params.weftSheen;
    uniformData[36] = params.roughnessMin;
    uniformData[37] = params.roughnessMax;
    uniformData[38] = params.normalStrength;
    uniformData[39] = params.threadHeightScale;
    uniformData[40] = params.threadShadowStrength;

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    const gradientTexture = createGradientTexture(device, params.gradientStops);
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });

    const module = device.createShaderModule({
        code: twillWeaveShaderWGSL,
    });

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: 20,
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: 12, format: 'float32x2' },
                    ],
                },
            ],
        },
        fragment: {
            module,
            entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: gradientTexture.createView() },
            { binding: 2, resource: sampler },
        ],
    });

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

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: texture.createView(),
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

    const bytesPerPixel = 4;
    const unalignedBytesPerRow = width * bytesPerPixel;
    const align = 256;
    const bytesPerRow = Math.ceil(unalignedBytesPerRow / align) * align;

    const readBuffer = device.createBuffer({
        size: bytesPerRow * height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

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