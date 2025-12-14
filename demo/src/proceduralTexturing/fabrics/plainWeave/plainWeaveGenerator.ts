import { plainWeaveShaderWGSL } from './plainWeave.code'
import { getWebGPUDevice } from '../../../utils/webgpu/deviceCache/webgpuDevice'

import { PlainWeaveParams } from "./plainWeave.types";

export const defaultPlainWeaveParams: PlainWeaveParams = {
    tileSize: 1.0,
    threadDensity: 20.0,        // 每单位长度20根纱线
    threadThickness: 0.45,      // 中等粗细
    warpWeftRatio: 1.0,         // 经纬线密度相等

    // 纱线结构
    threadTwist: 0.5,           // 中等捻度
    fiberDetail: 0.3,           // 适度的纤维细节
    fuzziness: 0.2,             // 少量毛绒

    // 织造特征
    weaveTightness: 0.7,        // 较紧密的织造
    threadUnevenness: 0.15,     // 轻微的不均匀
    weaveImperfection: 0.1,     // 轻微的不完美

    // 颜色渐变 - 默认为浅米色织物
    gradientStops: [
        { offset: 0.0, color: '#D4C8B8' }, // 较暗的纱线部分
        { offset: 1.0, color: '#F0E8DC' }  // 较亮的纱线部分
    ],

    // 高级参数默认值
    fbmOctaves: 3,
    fbmAmplitude: 0.3,
    noiseFrequency: 2.0,
    colorVariation: 0.05,

    // 光泽和材质
    warpSheen: 0.3,             // 经线有一定光泽
    weftSheen: 0.25,            // 纬线光泽稍弱
    roughnessMin: 0.4,
    roughnessMax: 0.8,
    normalStrength: 5.0,

    // 纱线厚度调节
    threadHeightScale: 1.0,
    threadShadowStrength: 0.3,
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

export async function generatePlainWeaveTexture(params: PlainWeaveParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice()
    if (!device) {
        throw new Error('WebGPU not supported')
    }

    // 1. Create Texture
    const texture = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    })

    // Uniform buffer 结构:
    // 16 (matrix) + 4 (core) + 3 (thread) + 3 (weave) + 1 (padding1) = 27
    // + 4 (advanced) + 5 (sheen) + 2 (thread height) + 1 (padding2) = 39
    // Align to 44 floats (176 bytes)
    const uniformData = new Float32Array(44);

    // Identity Matrix for viewMatrix (not used but required)
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    // 核心参数 (16-19)
    uniformData[16] = params.tileSize;
    uniformData[17] = params.threadDensity;
    uniformData[18] = params.threadThickness;
    uniformData[19] = params.warpWeftRatio;

    // 纱线结构 (20-22)
    uniformData[20] = params.threadTwist;
    uniformData[21] = params.fiberDetail;
    uniformData[22] = params.fuzziness;

    // 织造特征 (23-25)
    uniformData[23] = params.weaveTightness;
    uniformData[24] = params.threadUnevenness;
    uniformData[25] = params.weaveImperfection;

    uniformData[26] = 0; // padding1

    // 高级参数 (27-30)
    uniformData[27] = params.fbmOctaves;
    uniformData[28] = params.fbmAmplitude;
    uniformData[29] = params.noiseFrequency;
    uniformData[30] = params.colorVariation;

    // 光泽和材质 (31-35)
    uniformData[31] = params.warpSheen;
    uniformData[32] = params.weftSheen;
    uniformData[33] = params.roughnessMin;
    uniformData[34] = params.roughnessMax;
    uniformData[35] = params.normalStrength;

    // 纱线厚度调节 (36-37)
    uniformData[36] = params.threadHeightScale;
    uniformData[37] = params.threadShadowStrength;

    // Padding (38-43)
    uniformData[38] = 0;
    uniformData[39] = 0;
    uniformData[40] = 0;
    uniformData[41] = 0;
    uniformData[42] = 0;
    uniformData[43] = 0;

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // Create Gradient Texture
    const gradientTexture = createGradientTexture(device, params.gradientStops);
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });

    // 3. Create Pipeline
    const module = device.createShaderModule({
        code: plainWeaveShaderWGSL,
    });

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: 20, // 3 pos + 2 uv = 5 floats * 4 bytes
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

    // 4. Create Bind Group
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: gradientTexture.createView() },
            { binding: 2, resource: sampler },
        ],
    });

    // 5. Create Fullscreen Quad Buffer
    // x, y, z, u, v
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

    // 6. Render
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

    // 7. Read back texture
    // Align bytesPerRow to 256
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

    // 8. Convert to ImageData and then Base64
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    const data = new Uint8Array(arrayBuffer);
    const imageData = ctx.createImageData(width, height);

    // Copy row by row to remove padding and swizzle BGRA to RGBA
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
