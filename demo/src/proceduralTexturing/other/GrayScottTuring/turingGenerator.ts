import { filmGradeTuringShaderWGSL, FilmGradeTuringParams } from './turing'
import { getWebGPUDevice } from '../../../utils/webgpu/webgpuDevice'

export type { FilmGradeTuringParams }

/**
 * Gray-Scott图灵斑图预设
 */
export const defaultFilmParams: FilmGradeTuringParams = {
    tileSize: 1.0,
    simulationSteps: 2000,

    // Gray-Scott核心参数 (Coral/Maze Pattern)
    feedRate: 0.058,
    killRate: 0.062,

    // 各向异性扩散 (默认关闭)
    diffusionAnisotropy: 0.0,
    flowDirection: 0.4,

    // 空间变化
    variationScale: 1.5,
    variationStrength: 0.3
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

    // 3. 渲染Uniforms (简化版)
    const renderData = new Float32Array(4);
    renderData[0] = params.tileSize;
    // padding
    renderData[1] = 0;
    renderData[2] = 0;
    renderData[3] = 0;

    const renderBuffer = device.createBuffer({
        size: renderData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(renderBuffer, 0, renderData);


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