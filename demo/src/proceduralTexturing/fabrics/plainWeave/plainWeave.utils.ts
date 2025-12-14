import { plainWeaveShaderWGSL } from './plainWeave.code'
import {
    PlainWeaveParams,
    PlainWeaveResources,
    RenderPlainWeaveParams,
    TextureExportConfig
} from "./plainWeave.types";

export function createGradientTexture(device: GPUDevice, stops: { offset: number, color: string }[]): GPUTexture {
    const width = 256;
    const height = 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    const sortedStops = [...stops].sort((stopA, stopB) => stopA.offset - stopB.offset);

    for (const stop of sortedStops) {
        gradient.addColorStop(stop.offset, stop.color);
    }

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

export function createPlainWeaveUniformBuffer(device: GPUDevice, params: PlainWeaveParams): GPUBuffer {
    const uniformData = new Float32Array(44);

    // Identity Matrix
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

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    return uniformBuffer;
}

export function createPlainWeavePipeline(device: GPUDevice): GPURenderPipeline {
    const module = device.createShaderModule({
        code: plainWeaveShaderWGSL,
    });

    return device.createRenderPipeline({
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
}



export function createPlainWeaveResources(device: GPUDevice, params: PlainWeaveParams): PlainWeaveResources {
    const uniformBuffer = createPlainWeaveUniformBuffer(device, params);
    const gradientTexture = createGradientTexture(device, params.gradientStops);
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });

    const pipeline = createPlainWeavePipeline(device);

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: gradientTexture.createView() },
            { binding: 2, resource: sampler },
        ],
    });

    return { pipeline, bindGroup };
}

export function createFullscreenQuadBuffer(device: GPUDevice): GPUBuffer {
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
    return vertexBuffer;
}



export function runPlainWeaveRenderPass(device: GPUDevice, params: RenderPlainWeaveParams): void {
    const { texture, pipeline, bindGroup, vertexBuffer } = params;
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

    device.queue.submit([commandEncoder.finish()]);
}



export async function convertTextureToBase64(config: TextureExportConfig): Promise<string> {
    const { device, texture, width, height } = config;
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

    for (let y = 0; y < height; y++) {
        const srcOffset = y * bytesPerRow;
        const dstOffset = y * width * 4;

        for (let x = 0; x < width; x++) {
            const srcIndex = srcOffset + x * 4;
            const dstIndex = dstOffset + x * 4;
            imageData.data[dstIndex] = data[srcIndex + 2];     // R
            imageData.data[dstIndex + 1] = data[srcIndex + 1]; // G
            imageData.data[dstIndex + 2] = data[srcIndex];     // B
            imageData.data[dstIndex + 3] = data[srcIndex + 3]; // A
        }
    }

    ctx.putImageData(imageData, 0, 0);
    readBuffer.unmap();

    return canvas.toDataURL('image/png');
}
