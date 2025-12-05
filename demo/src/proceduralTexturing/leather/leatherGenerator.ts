import { leatherShaderWGSL, LeatherParams } from './leather'
export type { LeatherParams }
import { getWebGPUDevice } from '../../utils/webgpu/webgpuDevice'

/**
 * Default parameters for a generic cowhide leather
 */
export const defaultLeatherParams: LeatherParams = {
    tileSize: 1.0,

    // Grid-like but slightly organic
    cellScale: 15.0,
    cellRandomness: 0.7,
    cellStretch: 0.0,
    cellStretchAngle: 0.0,

    grooveWidth: 0.15,
    grooveDepth: 1.0,
    grooveProfile: 0.5, // U/V mix

    wrinkleScale: 8.0,
    wrinkleIntensity: 0.5,

    poreDensity: 2.0,
    poreDepth: 0.3,
    poreVisibility: 0.6,

    creaseIntensity: 0.0, // Clean by default
    creaseFrequency: 1.5,

    wearLevel: 0.0,
    scratchCount: 0.0,
    scratchIntensity: 0.5,

    roughnessMin: 0.4,
    roughnessMax: 0.7,
    normalStrength: 8.0,

    patinaStrength: 0.2, // Slight darkening in grooves
    colorVariation: 0.1,

    gradientStops: [
        { offset: 0.0, color: '#3E2723' }, // Dark Brown (Grooves)
        { offset: 1.0, color: '#8D6E63' }  // Light Brown (Surface)
    ],
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

export async function generateLeatherTexture(params: LeatherParams, width: number, height: number): Promise<string> {
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

    // 2. Uniforms
    // 16 floats for Matrix + 25 floats for params = 41 floats
    // Align to 44 floats (176 bytes)
    const uniformData = new Float32Array(44);

    // Identity Matrix
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    // Start filling at index 16
    let i = 16;
    uniformData[i++] = params.tileSize;
    uniformData[i++] = params.cellScale;
    uniformData[i++] = params.cellRandomness;
    uniformData[i++] = params.cellStretch;
    uniformData[i++] = params.cellStretchAngle;

    uniformData[i++] = params.grooveWidth;
    uniformData[i++] = params.grooveDepth;
    uniformData[i++] = params.grooveProfile;

    uniformData[i++] = params.wrinkleScale;
    uniformData[i++] = params.wrinkleIntensity;
    uniformData[i++] = params.poreDensity;
    uniformData[i++] = params.poreDepth;
    uniformData[i++] = params.poreVisibility;

    uniformData[i++] = params.creaseIntensity;
    uniformData[i++] = params.creaseFrequency;
    uniformData[i++] = params.wearLevel;
    uniformData[i++] = params.scratchCount;
    uniformData[i++] = params.scratchIntensity;

    uniformData[i++] = params.roughnessMin;
    uniformData[i++] = params.roughnessMax;
    uniformData[i++] = params.normalStrength;

    uniformData[i++] = params.patinaStrength;
    uniformData[i++] = params.colorVariation;

    // Padding
    uniformData[i++] = 0;
    uniformData[i++] = 0;

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // 3. Gradient
    const gradientTexture = createGradientTexture(device, params.gradientStops);
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });

    // 4. Pipeline
    const module = device.createShaderModule({
        code: leatherShaderWGSL,
    });

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: 20, // 3 pos + 2 uv
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

    // 5. Quad (Full screen)
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

    const canvasBack = document.createElement('canvas');
    canvasBack.width = width;
    canvasBack.height = height;
    const ctxBack = canvasBack.getContext('2d');
    if (!ctxBack) throw new Error('Could not get 2d context');

    const data = new Uint8Array(arrayBuffer);
    const imageData = ctxBack.createImageData(width, height);

    // Copy to imageData (removing padding and swizzling if needed)
    for (let y = 0; y < height; y++) {
        const srcOffset = y * bytesPerRow;
        const dstOffset = y * width * 4;

        for (let x = 0; x < width; x++) {
            const i = srcOffset + x * 4;
            const j = dstOffset + x * 4;

            // bgra8unorm internal -> MapRead.
            // CAREFUL: In WebGPU, 'bgra8unorm' usually means B is at 0, G at 1, R at 2, A at 3.
            // But MapRead layout depends on the texture.
            // Let's assume standard BGR mapping if it was BGRA.

            imageData.data[j] = data[i + 2];     // R
            imageData.data[j + 1] = data[i + 1]; // G
            imageData.data[j + 2] = data[i];     // B
            imageData.data[j + 3] = data[i + 3]; // A
        }
    }

    ctxBack.putImageData(imageData, 0, 0);
    readBuffer.unmap();

    return canvasBack.toDataURL('image/png');
}
