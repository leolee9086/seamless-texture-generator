import { filmGradeTuringShaderWGSL, FilmGradeTuringParams } from './turing'
import { getWebGPUDevice } from '../../../utils/webgpu/webgpuDevice'

export type { FilmGradeTuringParams }

/**
 * 影视级预设：异星生物甲壳 (Alien Carapace)
 * 结合了有机的流动感和硬朗的细节
 */
export const defaultFilmParams: FilmGradeTuringParams = {
    tileSize: 1.0,
    simulationSteps: 2000, // Restore steps for pattern formation

    // 反应堆：强烈的各向异性，产生类似肌肉纤维或木纹的流动
    feedRate: 0.058, // Classic Coral/Maze Pattern
    killRate: 0.062,
    diffusionAnisotropy: 0.0, // Start isotropic for stability
    flowDirection: 0.4,       // 倾斜角度

    // 变异：大范围的自然过渡
    patternScale: 1.0,
    variationScale: 1.5,
    variationStrength: 0.3,

    // 微观细节：清晰的毛孔和细纹
    poreDensity: 30.0,
    poreDepth: 0.05,
    skinWrinkleScale: 12.0,
    skinWrinkleStrength: 0.03,

    // 材质：深邃的半透明质感
    subsurfaceColor: '#8a1c0e', // 血红色真皮
    epidermisColor: '#d6b6a0',  // 苍白表皮
    pigmentColor: '#1a1a1a',    // 黑色素

    // 光照
    roughnessBase: 0.6,         // 皮肤较粗糙
    roughnessPigment: 0.3,      // 黑色素区域光滑（像甲壳）
    normalDetail: 1.5,          // 强烈的法线细节
    heightDisplacement: 1.0
}

// Helper: Hex -> Linear RGB (Correct for PBR)
function hexToLinear(hex: string): [number, number, number] {
    const bigint = parseInt(hex.slice(1), 16);
    let r = ((bigint >> 16) & 255) / 255;
    let g = ((bigint >> 8) & 255) / 255;
    let b = (bigint & 255) / 255;
    // sRGB -> Linear approx
    r = Math.pow(r, 2.2);
    g = Math.pow(g, 2.2);
    b = Math.pow(b, 2.2);
    return [r, g, b];
}

export async function generateFilmGradeTexture(params: FilmGradeTuringParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice();
    if (!device) throw new Error('WebGPU Unsupported');

    // 1. Setup Storage Textures (Ping-Pong)
    // Film-grade requires 32-bit float for stable RD simulation
    const texDesc: GPUTextureDescriptor = {
        size: [width, height],
        format: 'rgba32float',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    };
    const texA = device.createTexture(texDesc);
    const texB = device.createTexture(texDesc);

    // 预初始化 texA (关键：避免每次迭代都触发shader初始化)
    const initData = new Float32Array(width * height * 4);
    const seed = Math.random() * 1000.0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            // A = 1.0 everywhere
            initData[idx] = 1.0;
            // B = 小的随机扰动 (避免极端值导致白色空洞)
            // 使用 0-0.3 的随机值作为种子，而不是 0 或 1
            initData[idx + 1] = Math.random() * 0.3;
            initData[idx + 2] = 0.0;
            initData[idx + 3] = 1.0;
        }
    }

    // 写入 texA
    device.queue.writeTexture(
        { texture: texA },
        initData,
        { bytesPerRow: width * 16 }, // rgba32float = 16 bytes per pixel
        [width, height]
    );

    // 2. Simulation Uniforms
    const simData = new Float32Array(12); // aligned
    simData[0] = params.feedRate;
    simData[1] = params.killRate;
    simData[2] = params.diffusionAnisotropy;
    simData[3] = params.flowDirection;
    simData[4] = params.variationScale;
    simData[5] = params.variationStrength;
    simData[6] = 1; // dt (大幅减小以确保CFL稳定性: dt*D/dx^2 < 0.5)
    simData[7] = Math.random() * 1000.0; // seed

    const simBuffer = device.createBuffer({
        size: simData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(simBuffer, 0, simData);

    // 3. Render Uniforms
    // 需要仔细打包对齐 (std140 layout)
    // vec3 需要 16 byte padding, float 需要 4 byte
    const renderData = new Float32Array(32);

    // Matrix (0-15) - Unused but padding
    renderData[0] = 1; renderData[5] = 1;

    // Colors (vec3 needs 16-byte align in struct if not carefully packed, 
    // but here we pack manually into float array)
    // Offset 16: SubColor (3 floats + 1 pad)
    const cSub = hexToLinear(params.subsurfaceColor);
    renderData[16] = cSub[0]; renderData[17] = cSub[1]; renderData[18] = cSub[2]; renderData[19] = 0;

    // Offset 20: EpiColor
    const cEpi = hexToLinear(params.epidermisColor);
    renderData[20] = cEpi[0]; renderData[21] = cEpi[1]; renderData[22] = cEpi[2]; renderData[23] = 0;

    // Offset 24: PigColor
    const cPig = hexToLinear(params.pigmentColor);
    renderData[24] = cPig[0]; renderData[25] = cPig[1]; renderData[26] = cPig[2]; renderData[27] = 0;

    // Create separate buffer for scalar params to avoid alignment hell or append
    // Let's create a secondary Float32Array for scalars starting at logical offset
    // Actually, let's just use a second buffer or carefully map.
    // Let's use a bigger buffer.
    const renderParamsData = new Float32Array(20);
    let k = 0;
    renderParamsData[k++] = params.tileSize;
    renderParamsData[k++] = params.poreDensity;
    renderParamsData[k++] = params.poreDepth;
    renderParamsData[k++] = params.skinWrinkleScale;
    renderParamsData[k++] = params.skinWrinkleStrength;
    renderParamsData[k++] = params.roughnessBase;
    renderParamsData[k++] = params.roughnessPigment;
    renderParamsData[k++] = params.normalDetail;
    renderParamsData[k++] = params.heightDisplacement;

    // We need to merge these or bind appropriately.
    // For simplicity, let's look at shader struct:
    // struct RenderUniforms { mat4, vec3, vec3, vec3, float... }
    // The floats start after the last vec3.
    // Last vec3 ended at index 27 (including pad).
    // WebGPU struct layout rules:
    // vec3 is 16 bytes aligned.
    // floats are 4 bytes.
    // So index 28 starts the floats.
    const fullRenderData = new Float32Array(64); // Safe size
    fullRenderData.set(renderData.subarray(0, 28), 0);

    // Copy scalars
    let offset = 28;
    fullRenderData[offset++] = params.tileSize;
    fullRenderData[offset++] = params.poreDensity;
    fullRenderData[offset++] = params.poreDepth;
    fullRenderData[offset++] = params.skinWrinkleScale;
    fullRenderData[offset++] = params.skinWrinkleStrength; // This aligns to 32 bytes boundary check? No floats are 4 bytes.

    fullRenderData[offset++] = params.roughnessBase;
    fullRenderData[offset++] = params.roughnessPigment;
    fullRenderData[offset++] = params.normalDetail;
    fullRenderData[offset++] = params.heightDisplacement;

    const renderBuffer = device.createBuffer({
        size: fullRenderData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(renderBuffer, 0, fullRenderData);


    // 4. Pipelines
    const module = device.createShaderModule({ code: filmGradeTuringShaderWGSL });

    // Compute Pipeline
    // Compute Pipeline Layout
    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float' } }
        ]
    });

    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout]
    });

    const computePipeline = device.createComputePipeline({
        layout: computePipelineLayout,
        compute: { module, entryPoint: 'cs_main' }
    });
    const compLayout = computePipeline.getBindGroupLayout(0);
    const bgAtoB = device.createBindGroup({
        layout: compLayout,
        entries: [
            { binding: 0, resource: { buffer: simBuffer } },
            { binding: 1, resource: texA.createView() },
            { binding: 2, resource: texB.createView() }
        ]
    });
    const bgBtoA = device.createBindGroup({
        layout: compLayout,
        entries: [
            { binding: 0, resource: { buffer: simBuffer } },
            { binding: 1, resource: texB.createView() },
            { binding: 2, resource: texA.createView() }
        ]
    });

    // Render Pipeline
    // Render Pipeline Layout
    const renderBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } }
        ]
    });

    const renderPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [renderBindGroupLayout]
    });

    const renderPipeline = device.createRenderPipeline({
        layout: renderPipelineLayout,
        vertex: {
            module, entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x2' }
                ]
            }]
        },
        fragment: {
            module, entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }]
        },
        primitive: { topology: 'triangle-list' }
    });

    // 5. Simulation Loop
    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(computePipeline);

    const wgX = Math.ceil(width / 8);
    const wgY = Math.ceil(height / 8);

    for (let i = 0; i < params.simulationSteps; i++) {
        if (i % 2 === 0) pass.setBindGroup(0, bgAtoB);
        else pass.setBindGroup(0, bgBtoA);
        pass.dispatchWorkgroups(wgX, wgY);
    }
    pass.end();

    // 6. Rendering
    const finalSimTex = (params.simulationSteps % 2 === 0) ? texA : texB;
    // rgba32float is unfilterable, must use nearest sampler or manual filtering
    const sampler = device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'repeat', addressModeV: 'repeat' });

    const renderBG = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: renderBuffer } },
            { binding: 1, resource: finalSimTex.createView() },
            { binding: 2, resource: sampler }
        ]
    });

    const outputTex = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });

    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: outputTex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 1 }, storeOp: 'store'
        }]
    });

    // Quad
    const quadVertices = new Float32Array([
        -1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0,
        -1, 1, 0, 0, 0, 1, -1, 0, 1, 1, 1, 1, 0, 1, 0
    ]);
    const vertBuf = device.createBuffer({ size: quadVertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, mappedAtCreation: true });
    new Float32Array(vertBuf.getMappedRange()).set(quadVertices);
    vertBuf.unmap();

    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBG);
    renderPass.setVertexBuffer(0, vertBuf);
    renderPass.draw(6, 1, 0, 0);
    renderPass.end();

    // 7. Readback
    const bytesPerRow = Math.ceil(width * 4 / 256) * 256;
    const readBuffer = device.createBuffer({ size: bytesPerRow * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    commandEncoder.copyTextureToBuffer({ texture: outputTex }, { buffer: readBuffer, bytesPerRow }, [width, height]);

    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const idata = ctx.createImageData(width, height);
    const raw = new Uint8Array(readBuffer.getMappedRange());

    for (let y = 0; y < height; y++) {
        const so = y * bytesPerRow; const do_ = y * width * 4;
        for (let x = 0; x < width; x++) {
            const s = so + x * 4; const d = do_ + x * 4;
            idata.data[d] = raw[s + 2]; idata.data[d + 1] = raw[s + 1]; idata.data[d + 2] = raw[s]; idata.data[d + 3] = 255;
        }
    }
    ctx.putImageData(idata, 0, 0);
    readBuffer.unmap();

    return canvas.toDataURL('image/png');
}