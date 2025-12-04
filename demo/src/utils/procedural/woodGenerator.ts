import { woodShaderWGSL } from '../../proceduralTexturing/wood'
import { getWebGPUDevice } from '../webgpu/webgpuDevice'

export interface WoodParams {
    tileSize: number;       // 平铺尺寸 (例如 1.0 表示在 0-1 UV 内无缝循环)
    ringScale: number;      // 年轮总数
    ringDistortion: number; // 生长扭曲度
    knotIntensity: number;  // 树结强度
    latewoodBias: number;   // 晚材偏差 (0.0-1.0, 控制深色硬边部分的尖锐度)
    rayStrength: number;    // 髓射线强度 (垂直于年轮的细纹)
    poreDensity: number;    // 导管/毛孔密度
    colorEarly: number[];   // 早材颜色 (浅) [r, g, b]
    colorLate: number[];    // 晚材颜色 (深) [r, g, b]
}

export const defaultWoodParams: WoodParams = {
    tileSize: 1.0,
    ringScale: 8.0,
    ringDistortion: 1.0,
    knotIntensity: 1.0,
    latewoodBias: 0.8,
    rayStrength: 0.5,
    poreDensity: 10.0,
    colorEarly: [0.86, 0.72, 0.54], // #DCC8A9
    colorLate: [0.45, 0.31, 0.20],  // #734F33
}

export async function generateWoodTexture(params: WoodParams, width: number, height: number): Promise<string> {
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

    // 2. Create Uniform Buffer
    // Struct alignment rules apply. 
    // vec3<f32> aligns to 16 bytes (4 floats)
    // f32 aligns to 4 bytes

    // Uniforms struct in shader:
    // viewMatrix : mat4x4<f32>, // 64 bytes (offset 0)
    // tileSize : f32,         // 4 bytes (offset 64)
    // ringScale : f32,        // 4 bytes (offset 68)
    // ringDistortion : f32,   // 4 bytes (offset 72)
    // knotIntensity : f32,    // 4 bytes (offset 76)
    // latewoodBias : f32,     // 4 bytes (offset 80)
    // rayStrength : f32,      // 4 bytes (offset 84)
    // poreDensity : f32,      // 4 bytes (offset 88)
    // padding : f32,          // 4 bytes (offset 92) -> Total 96
    // colorEarly : vec3<f32>, // 12 bytes (offset 96) - BUT vec3 aligns to 16 bytes, so offset 96 is OK? No, vec3 usually treated as vec4 in std140 or needs padding.
    //                         // In WGSL `vec3<f32>` has 16-byte alignment if used in uniform buffer? 
    //                         // Let's check the shader struct again.
    //                         // struct Uniforms { ... colorEarly : vec3<f32>, padding2 : f32, colorLate : vec3<f32>, padding3 : f32 };

    // Let's look at the shader definition in wood.ts:
    /*
    struct Uniforms {
        viewMatrix : mat4x4<f32>,
        tileSize : f32,
        ringScale : f32,
        ringDistortion : f32,
        knotIntensity : f32,
        latewoodBias : f32,
        rayStrength : f32,
        poreDensity : f32,
        padding : f32, 
        colorEarly : vec3<f32>,
        padding2 : f32,
        colorLate : vec3<f32>,
        padding3 : f32,
    };
    */

    // Layout:
    // 0-63: viewMatrix (16 floats)
    // 64: tileSize
    // 68: ringScale
    // 72: ringDistortion
    // 76: knotIntensity
    // 80: latewoodBias
    // 84: rayStrength
    // 88: poreDensity
    // 92: padding
    // 96-107: colorEarly (3 floats)
    // 108: padding2 (1 float)
    // 112-123: colorLate (3 floats)
    // 124: padding3 (1 float)
    // Total size: 128 bytes (32 floats)

    const uniformData = new Float32Array(32);

    // Identity Matrix for viewMatrix (not used but required)
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    uniformData[16] = params.tileSize;
    uniformData[17] = params.ringScale;
    uniformData[18] = params.ringDistortion;
    uniformData[19] = params.knotIntensity;
    uniformData[20] = params.latewoodBias;
    uniformData[21] = params.rayStrength;
    uniformData[22] = params.poreDensity;
    uniformData[23] = 0; // padding

    uniformData[24] = params.colorEarly[0];
    uniformData[25] = params.colorEarly[1];
    uniformData[26] = params.colorEarly[2];
    uniformData[27] = 0; // padding2

    uniformData[28] = params.colorLate[0];
    uniformData[29] = params.colorLate[1];
    uniformData[30] = params.colorLate[2];
    uniformData[31] = 0; // padding3

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // 3. Create Pipeline
    const module = device.createShaderModule({
        code: woodShaderWGSL,
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

    // Copy row by row to remove padding
    for (let y = 0; y < height; y++) {
        const srcOffset = y * bytesPerRow;
        const dstOffset = y * width * 4;
        // In BGRA, we need to swizzle to RGBA for ImageData?
        // WebGPU 'bgra8unorm' usually maps to surface, but when reading back...
        // Let's check. copyTextureToBuffer copies raw bytes.
        // If texture is bgra8unorm, the bytes are B, G, R, A.
        // ImageData expects R, G, B, A.

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
