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

    // 高级参数
    fbmOctaves: number;     // FBM 噪声的 octaves 数量 (1-5)
    fbmAmplitude: number;   // FBM 初始振幅 (0.1-1.0)
    knotFrequency: number;  // 树结噪声频率 (0.5-2.0)
    distortionFreq: number; // 域扭曲频率 (1.0-3.0)
    ringNoiseFreq: number;  // 年轮噪声频率 (3.0-10.0)
    rayFrequencyX: number;  // 髓射线 X 方向频率 (30.0-100.0)
    rayFrequencyY: number;  // 髓射线 Y 方向频率 (1.0-5.0)
    knotThresholdMin: number; // 树结阈值最小值 (0.0-1.0)
    knotThresholdMax: number; // 树结阈值最大值 (0.0-1.0)
    normalStrength: number;   // 法线强度 (1.0-20.0)
    roughnessMin: number;     // 最小粗糙度 (0.1-0.5)
    roughnessMax: number;     // 最大粗糙度 (0.5-1.0)

    // 孔隙参数
    poreScale: number;          // 孔隙尺寸 (0.5-5.0)
    poreThresholdEarly: number; // 早材孔隙阈值下限 (0.0-1.0)
    poreThresholdLate: number;  // 晚材孔隙阈值下限 (0.0-1.0)
    poreThresholdRange: number; // 阈值范围 (0.1-0.3)
    poreStrength: number;       // 孔隙强度 (0.0-1.0)
}

export const defaultWoodParams: WoodParams = {
    tileSize: 1.0,
    ringScale: 8.0,
    ringDistortion: 1.0,
    knotIntensity: 1.0,
    latewoodBias: 0.8,
    rayStrength: 0.6,      // 增加强度，使射线更明显
    poreDensity: 20.0,     // 增加密度，产生更多小孔
    colorEarly: [0.86, 0.72, 0.54], // #DCC8A9
    colorLate: [0.45, 0.31, 0.20],  // #734F33

    // 高级参数默认值
    fbmOctaves: 3,
    fbmAmplitude: 0.5,
    knotFrequency: 0.8,
    distortionFreq: 1.5,
    ringNoiseFreq: 5.0,
    rayFrequencyX: 30.0,   // 降低频率，适应新算法（正弦波频率）
    rayFrequencyY: 8.0,    // 增加纵向变化
    knotThresholdMin: 0.4,
    knotThresholdMax: 0.8,
    normalStrength: 8.0,
    roughnessMin: 0.35,
    roughnessMax: 0.7,

    // 孔隙参数默认值
    poreScale: 1.0,             // 默认尺寸
    poreThresholdEarly: 0.55,   // 早材阈值（较低，更多孔隙）
    poreThresholdLate: 0.7,     // 晚材阈值（较高，较少孔隙）
    poreThresholdRange: 0.2,    // 阈值范围
    poreStrength: 0.4,          // 强度
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

    // 扩展 uniform buffer 以容纳新参数
    // 原始: 16 (matrix) + 7 (core params) + 1 (padding) + 4 (color early) + 4 (color late) = 32 floats
    // 新增: 12 个高级参数 + 5 个孔隙参数
    // 小计: 32 + 12 + 5 = 49 floats
    // WebGPU要求16字节对齐，49 floats = 196字节，需要padding到52 floats = 208字节
    const uniformData = new Float32Array(52);

    // Identity Matrix for viewMatrix (not used but required)
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    // 核心参数
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

    // 高级参数
    uniformData[32] = params.fbmOctaves;
    uniformData[33] = params.fbmAmplitude;
    uniformData[34] = params.knotFrequency;
    uniformData[35] = params.distortionFreq;
    uniformData[36] = params.ringNoiseFreq;
    uniformData[37] = params.rayFrequencyX;
    uniformData[38] = params.rayFrequencyY;
    uniformData[39] = params.knotThresholdMin;
    uniformData[40] = params.knotThresholdMax;
    uniformData[41] = params.normalStrength;
    uniformData[42] = params.roughnessMin;
    uniformData[43] = params.roughnessMax;

    // 孔隙参数
    uniformData[44] = params.poreScale;
    uniformData[45] = params.poreThresholdEarly;
    uniformData[46] = params.poreThresholdLate;
    uniformData[47] = params.poreThresholdRange;
    uniformData[48] = params.poreStrength;
    // padding for 16-byte alignment (49->52 floats = 208 bytes)
    uniformData[49] = 0;
    uniformData[50] = 0;
    uniformData[51] = 0;

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

