import { turingComputeWGSL, turingRenderWGSL, turingMaterialWGSL, minMaxComputeWGSL, FilmGradeTuringParams, initTuringWGSL } from './turing'
import { getWebGPUDevice } from '../../../utils/webgpu/webgpuDevice'

export type { FilmGradeTuringParams }

export const defaultFilmParams: FilmGradeTuringParams = {
    tileSize: 1.0,
    simulationSteps: 100,
    activatorRadius: 1.5,  // 减小采样半径
    inhibitorRadius: 4.0,  // 减小采样半径
    curvature: 0.55,
    diffusionAnisotropy: 0.2,
    flowDirection: 0.0,
    patternScale: 1.0,
    variationScale: 1.5,
    variationStrength: 0.5,
    poreDensity: 30.0,
    poreDepth: 0.05,
    skinWrinkleScale: 12.0,
    skinWrinkleStrength: 0.03,
    subsurfaceColor: '#8a1c0e',
    epidermisColor: '#d6b6a0',
    pigmentColor: '#1a1a1a',
    roughnessBase: 0.6,
    roughnessPigment: 0.3,
    normalDetail: 1.5,
    heightDisplacement: 1.0,
    contrast: 1.0,
    bias: 0.0
}

function hexToLinear(hex: string): [number, number, number] {
    const bigint = parseInt(hex.slice(1), 16);
    let r = ((bigint >> 16) & 255) / 255;
    let g = ((bigint >> 8) & 255) / 255;
    let b = (bigint & 255) / 255;
    r = Math.pow(r, 2.2);
    g = Math.pow(g, 2.2);
    b = Math.pow(b, 2.2);
    return [r, g, b];
}

export async function generateFilmGradeTexture(params: FilmGradeTuringParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice();
    if (!device) throw new Error('WebGPU Unsupported');

    // 1. Setup Storage Textures
    const texDesc: GPUTextureDescriptor = {
        size: [width, height],
        format: 'rgba32float',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    };
    const texA = device.createTexture(texDesc);
    const texB = device.createTexture(texDesc);

    // 2. Simulation Uniforms
    const simDataSize = 12 * 4;
    const simBuffer = device.createBuffer({
        size: Math.ceil(simDataSize / 16) * 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    const simUpload = new Float32Array(simBuffer.getMappedRange());
    simUpload[0] = params.activatorRadius;
    simUpload[1] = params.inhibitorRadius;
    simUpload[2] = params.curvature;
    simUpload[3] = params.diffusionAnisotropy;
    simUpload[4] = params.flowDirection;
    simUpload[5] = params.variationScale;
    simUpload[6] = params.variationStrength;
    simUpload[7] = Math.random() * 1000.0;
    simBuffer.unmap();

    // 3. Render Uniforms
    const renderDataSize = 64 * 4;
    const renderBuffer = device.createBuffer({
        size: renderDataSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    const renderUpload = new Float32Array(renderBuffer.getMappedRange());

    // Matrix identity
    renderUpload[0] = 1; renderUpload[5] = 1; renderUpload[10] = 1; renderUpload[15] = 1;

    // Colors
    // Offset 64 bytes -> Index 16
    const cSub = hexToLinear(params.subsurfaceColor);
    renderUpload[16] = cSub[0]; renderUpload[17] = cSub[1]; renderUpload[18] = cSub[2];

    // Offset 80 bytes -> Index 20
    const cEpi = hexToLinear(params.epidermisColor);
    renderUpload[20] = cEpi[0]; renderUpload[21] = cEpi[1]; renderUpload[22] = cEpi[2];

    // Offset 96 bytes -> Index 24
    const cPig = hexToLinear(params.pigmentColor);
    renderUpload[24] = cPig[0]; renderUpload[25] = cPig[1]; renderUpload[26] = cPig[2];

    // Floats from Offset 112 -> Index 28
    let offset = 28;
    // Safe-guard: if params.tileSize is 0 or undefined, force 1.0
    renderUpload[offset++] = (params.tileSize && params.tileSize > 0) ? params.tileSize : 1.0;
    renderUpload[offset++] = params.poreDensity;
    renderUpload[offset++] = params.poreDepth;
    renderUpload[offset++] = params.skinWrinkleScale;
    renderUpload[offset++] = params.skinWrinkleStrength;
    renderUpload[offset++] = params.roughnessBase;
    renderUpload[offset++] = params.roughnessPigment;
    renderUpload[offset++] = params.normalDetail;
    renderUpload[offset++] = params.heightDisplacement;

    // Contrast (Was padding1)
    renderUpload[offset++] = 10.0; // Hardcoded contrast multiplier for now

    // Bias (Was padding2)
    renderUpload[offset++] = 0.0;

    renderBuffer.unmap();

    // 3.5 MinMax Buffer (Atomic)
    const minMaxBuffer = device.createBuffer({
        size: 8, // 2 * i32
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    new Int32Array(minMaxBuffer.getMappedRange()).set([2147483647, -2147483647]); // Init with [MAX, MIN]
    minMaxBuffer.unmap();

    // 4. Pipelines
    // MODIFIED: Use initTuringWGSL for initialization
    const initModule = device.createShaderModule({ code: initTuringWGSL });
    const computeModule = device.createShaderModule({ code: turingComputeWGSL });
    const renderModule = device.createShaderModule({ code: turingRenderWGSL });

    // Init Pipeline
    const initBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float' } }
        ]
    });
    const initPipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [initBindGroupLayout] }),
        compute: { module: initModule, entryPoint: 'init_main' }
    });

    const bgInitA = device.createBindGroup({
        layout: initBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: simBuffer } },
            { binding: 2, resource: texA.createView() }
        ]
    });

    // Compute Pipeline
    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float' } }
        ]
    });
    const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] }),
        compute: { module: computeModule, entryPoint: 'cs_main' }
    });

    const bgAtoB = device.createBindGroup({
        layout: computeBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: simBuffer } },
            { binding: 1, resource: texA.createView() },
            { binding: 2, resource: texB.createView() }
        ]
    });
    const bgBtoA = device.createBindGroup({
        layout: computeBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: simBuffer } },
            { binding: 1, resource: texB.createView() },
            { binding: 2, resource: texA.createView() }
        ]
    });

    // Render Pipeline
    const renderBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } },
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } } // MinMax
        ]
    });

    // MinMax Pipeline
    const minMaxModule = device.createShaderModule({ code: minMaxComputeWGSL });
    const minMaxBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }
        ]
    });
    const minMaxPipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [minMaxBindGroupLayout] }),
        compute: { module: minMaxModule, entryPoint: 'main' }
    });
    const renderPipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
        vertex: {
            module: renderModule, entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x2' }
                ]
            }]
        },
        fragment: {
            module: renderModule, entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }]
        },
        primitive: { topology: 'triangle-list' }
    });

    // Material Pipeline (第二个pass)
    const materialModule = device.createShaderModule({ code: turingMaterialWGSL });
    const materialPipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
        vertex: {
            module: materialModule, entryPoint: 'vs_main',
            buffers: [{
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x2' }
                ]
            }]
        },
        fragment: {
            module: materialModule, entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }]
        },
        primitive: { topology: 'triangle-list' }
    });

    // 5. Loop
    const wgX = Math.ceil(width / 8);
    const wgY = Math.ceil(height / 8);

    const commandEncoder = device.createCommandEncoder();

    // Step 0: Initialize texA with noise
    {
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(initPipeline);
        pass.setBindGroup(0, bgInitA);
        pass.dispatchWorkgroups(wgX, wgY);
        pass.end();
    }

    // Run Simulation Steps
    const steps = params.simulationSteps > 0 ? params.simulationSteps : 100;
    for (let i = 0; i < steps; i++) {
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(computePipeline);
        if (i % 2 === 0) pass.setBindGroup(0, bgAtoB);
        else pass.setBindGroup(0, bgBtoA);
        pass.dispatchWorkgroups(wgX, wgY);
        pass.end();
    }

    // 6. 两个渲染Pass
    const finalSimTex = (steps % 2 === 0) ? texA : texB;

    // 6.1 Run MinMax Compute
    {
        // Reset Buffer
        const resetData = new Int32Array([2147483647, -2147483647]);
        device.queue.writeBuffer(minMaxBuffer, 0, resetData);

        const minMaxBG = device.createBindGroup({
            layout: minMaxBindGroupLayout,
            entries: [
                { binding: 0, resource: finalSimTex.createView() },
                { binding: 1, resource: { buffer: minMaxBuffer } }
            ]
        });

        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(minMaxPipeline);
        pass.setBindGroup(0, minMaxBG);
        pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16));
        pass.end();
    }

    const sampler = device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'repeat', addressModeV: 'repeat' });

    // 中间纹理: 存储第一个pass的灰度输出
    const grayTex = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    // 最终输出纹理
    const outputTex = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });

    const quadVertices = new Float32Array([
        -1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0,
        -1, 1, 0, 0, 0, 1, -1, 0, 1, 1, 1, 1, 0, 1, 0
    ]);
    const vertBuf = device.createBuffer({ size: quadVertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, mappedAtCreation: true });
    new Float32Array(vertBuf.getMappedRange()).set(quadVertices);
    vertBuf.unmap();

    // Pass 1: 对比度增强 (compute shader output -> grayTex)
    const grayPass = commandEncoder.beginRenderPass({
        colorAttachments: [{ view: grayTex.createView(), loadOp: 'clear', clearValue: { r: 1, g: 0, b: 0, a: 1 }, storeOp: 'store' }]
    });

    const grayBG = device.createBindGroup({
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: renderBuffer } },
            { binding: 1, resource: finalSimTex.createView() },
            { binding: 2, resource: sampler },
            { binding: 3, resource: { buffer: minMaxBuffer } }
        ]
    });

    grayPass.setPipeline(renderPipeline);
    grayPass.setBindGroup(0, grayBG);
    grayPass.setVertexBuffer(0, vertBuf);
    grayPass.draw(6, 1, 0, 0);
    grayPass.end();

    // Pass 2: 材质渲染 (grayTex -> outputTex)
    const materialPass = commandEncoder.beginRenderPass({
        colorAttachments: [{ view: outputTex.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 1, a: 1 }, storeOp: 'store' }]
    });

    const materialBG = device.createBindGroup({
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: renderBuffer } },
            { binding: 1, resource: grayTex.createView() },
            { binding: 2, resource: sampler },
            { binding: 3, resource: { buffer: minMaxBuffer } }
        ]
    });

    materialPass.setPipeline(materialPipeline);
    materialPass.setBindGroup(0, materialBG);
    materialPass.setVertexBuffer(0, vertBuf);
    materialPass.draw(6, 1, 0, 0);
    materialPass.end();

    // 7. Readback
    const bytesPerRow = Math.ceil(width * 4 / 256) * 256;
    const readBuffer = device.createBuffer({ size: bytesPerRow * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    commandEncoder.copyTextureToBuffer({ texture: outputTex }, { buffer: readBuffer, bytesPerRow }, [width, height]);

    device.queue.submit([commandEncoder.finish()]);
    await device.queue.onSubmittedWorkDone();

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
            idata.data[do_ + x * 4 + 0] = raw[so + x * 4 + 2]; // B
            idata.data[do_ + x * 4 + 1] = raw[so + x * 4 + 1]; // G
            idata.data[do_ + x * 4 + 2] = raw[so + x * 4 + 0]; // R
            idata.data[do_ + x * 4 + 3] = 255;
        }
    }

    ctx.putImageData(idata, 0, 0);
    readBuffer.unmap();
    return canvas.toDataURL('image/png');
}