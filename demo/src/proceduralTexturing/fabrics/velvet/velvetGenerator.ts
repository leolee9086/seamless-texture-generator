import { velvetShaderWGSL, VelvetParams } from './velvet'
import { getWebGPUDevice } from '../../../utils/webgpu/webgpuDevice'

// 辅助函数：Hex 转 RGB (0-1)
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

export const defaultVelvetParams: VelvetParams = {
    tileSize: 1.0,

    // 经典的深红天鹅绒
    baseColor: '#590510',      // 深酒红底色
    sheenColor: '#ff8c9e',     // 浅粉色高光，形成强烈对比

    // 物理结构
    pileHeight: 0.8,
    pileDensity: 0.9,
    pileSlant: 0.4,            // 轻微倒伏
    slantDirection: 45.0,      // 对角线方向

    // 压痕 (Crushed Velvet)
    crushStrength: 0.6,        // 明显的压痕效果
    crushScale: 0.5,           // 中等大小的压痕块
    crushDetail: 0.7,

    // 表面
    fiberGrain: 0.4,           // 有质感的噪点
    stripes: 0.0,              // 默认无条纹
    stripeFrequency: 5.0,

    // 噪声
    fbmOctaves: 4,
    noiseRoughness: 0.6,

    // 光照
    sheenIntensity: 0.8,       // 强光泽
    sheenFalloff: 2.5,         // 边缘光范围适中
    ambientOcclusion: 0.6,

    // 变化与环境
    colorVariation: 0.1,
    lightSourceX: 0.5,
    lightSourceY: 0.5,
}

export async function generateVelvetTexture(params: VelvetParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice();
    if (!device) {
        throw new Error('WebGPU not supported');
    }

    // 1. Create Texture
    const texture = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    // 2. Prepare Uniform Data
    // Buffer layout alignment needs care. We have ~26 floats.
    // 26 * 4 = 104 bytes. Round up to align 16 bytes.
    // Let's allocate 128 bytes (32 floats) to be safe and use padding.

    const uniformData = new Float32Array(44); // 足够的空间

    // Convert colors
    const baseRGB = hexToRgb(params.baseColor);
    const sheenRGB = hexToRgb(params.sheenColor);

    let offset = 0;

    // Matrix placeholder (0-15)
    uniformData.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], 0);
    offset += 16;

    uniformData[offset++] = params.tileSize;
    uniformData[offset++] = params.pileHeight;
    uniformData[offset++] = params.pileDensity;
    uniformData[offset++] = params.pileSlant;

    uniformData[offset++] = params.slantDirection;
    uniformData[offset++] = params.crushStrength;
    uniformData[offset++] = params.crushScale;
    uniformData[offset++] = params.crushDetail;

    uniformData[offset++] = params.fiberGrain;
    uniformData[offset++] = params.stripes;
    uniformData[offset++] = params.stripeFrequency;
    uniformData[offset++] = params.fbmOctaves;

    uniformData[offset++] = params.noiseRoughness;
    uniformData[offset++] = params.sheenIntensity;
    uniformData[offset++] = params.sheenFalloff;
    uniformData[offset++] = params.ambientOcclusion;

    uniformData[offset++] = params.colorVariation;
    uniformData[offset++] = params.lightSourceX;
    uniformData[offset++] = params.lightSourceY;
    uniformData[offset++] = baseRGB.r;

    uniformData[offset++] = baseRGB.g;
    uniformData[offset++] = baseRGB.b;
    uniformData[offset++] = sheenRGB.r;
    uniformData[offset++] = sheenRGB.g;

    uniformData[offset++] = sheenRGB.b;
    uniformData[offset++] = 0; // Padding

    // Create Uniform Buffer
    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // 3. Create Pipeline
    const module = device.createShaderModule({
        code: velvetShaderWGSL,
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
                        { shaderLocation: 0, offset: 0, format: 'float32x3' }, // pos
                        { shaderLocation: 1, offset: 12, format: 'float32x2' }, // uv
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
        ],
    });

    // 5. Fullscreen Quad
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

    // 7. Readback
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
            // BGRA -> RGBA
            imageData.data[j] = data[i + 2];
            imageData.data[j + 1] = data[i + 1];
            imageData.data[j + 2] = data[i];
            imageData.data[j + 3] = data[i + 3];
        }
    }

    ctx.putImageData(imageData, 0, 0);
    readBuffer.unmap();

    return canvas.toDataURL('image/png');
}