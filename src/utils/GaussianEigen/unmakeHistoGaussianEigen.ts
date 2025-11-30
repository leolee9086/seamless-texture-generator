import { 获取WebGPU设备 } from '../webgpuDevice';
import type { 图像输入 } from "../../types/imageProcessing";
import unmakeHistoWGSL from './unmakeHistoGaussianEigen.wgsl?raw';
import { dot } from "./dot";

// 保留原始的CPU实现作为备用
function unmakeHistoGaussianEigenCPU(input: 图像输入, target: 图像输入, eigenVectors: number[][]): 图像输入 {
    // sort target values
    let Rsorted: number[] = [];
    let Gsorted: number[] = [];
    let Bsorted: number[] = [];

    for (let j = 0; j < target.height; ++j)
        for (let i = 0; i < target.width; ++i) {
            const pixelIndex = (j * target.width + i) * 4;
            let p = [target.data[pixelIndex], target.data[pixelIndex + 1], target.data[pixelIndex + 2]];
            const r_proj = dot(p, eigenVectors[0]);
            const g_proj = dot(p, eigenVectors[1]);
            const b_proj = dot(p, eigenVectors[2]);
            Rsorted[i + j * target.width] = r_proj;
            Gsorted[i + j * target.width] = g_proj;
            Bsorted[i + j * target.width] = b_proj;
        }
    Rsorted = Array.from(Float32Array.from(Rsorted).sort());
    Gsorted = Array.from(Float32Array.from(Gsorted).sort());
    Bsorted = Array.from(Float32Array.from(Bsorted).sort());

    const totalPixels = input.width * input.height;
    const data: number[] = new Array(totalPixels * 4);

    for (let i = 0; i < totalPixels; i++) {
        const r = input.data[i * 4];
        const g = input.data[i * 4 + 1];
        const b = input.data[i * 4 + 2];

        const erf = (x: number): number => {
            var a1 = 0.254829592; var a2 = -0.284496736; var a3 = 1.421413741; var a4 = -1.453152027; var a5 = 1.061405429; var p = 0.3275911;
            var sign = x < 0 ? -1 : 1; x = Math.abs(x); var t = 1.0 / (1.0 + p * x);
            var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            return sign * y;
        }

        const mapValue = (value: number, sorted: number[]): { mappedValue: number, U: number, index: number } => {
            var U = 0.5 + 0.5 * erf(value / Math.sqrt(2.0));
            var index = Math.floor(U * Rsorted.length);
            index = Math.min(index, Rsorted.length - 1);
            return { mappedValue: sorted[index], U, index };
        }

        const rMapped = mapValue(r, Rsorted);
        const gMapped = mapValue(g, Gsorted);
        const bMapped = mapValue(b, Bsorted);

        const mappedR = rMapped.mappedValue;
        const mappedG = gMapped.mappedValue;
        const mappedB = bMapped.mappedValue;

        const evT = [
            [eigenVectors[0][0], eigenVectors[1][0], eigenVectors[2][0]],
            [eigenVectors[0][1], eigenVectors[1][1], eigenVectors[2][1]],
            [eigenVectors[0][2], eigenVectors[1][2], eigenVectors[2][2]],
        ];

        data[i * 4] = mappedR * evT[0][0] + mappedG * evT[0][1] + mappedB * evT[0][2];
        data[i * 4 + 1] = mappedR * evT[1][0] + mappedG * evT[1][1] + mappedB * evT[1][2];
        data[i * 4 + 2] = mappedR * evT[2][0] + mappedG * evT[2][1] + mappedB * evT[2][2];
        data[i * 4 + 3] = input.data[i * 4 + 3];
    }

    return { data, width: input.width, height: input.height };
}

const 是否为2的幂 = (n: number): boolean => (n & (n - 1)) === 0 && n !== 0;
const 计算最小2的幂 = (n: number): number => {
    if (n <= 0) return 1;
    let p = 1;
    while (p < n) { p <<= 1; }
    return p;
};

import type { WebGPU图像数据数组RGBA } from '../../types/imageProcessing';

async function unmakeHistoGaussianEigenWebGPU(input: WebGPU图像数据数组RGBA, target: WebGPU图像数据数组RGBA, eigenVectors: number[][]): Promise<WebGPU图像数据数组RGBA> {
    const 设备 = await 获取WebGPU设备();
    const shaderModule = 设备.createShaderModule({ code: unmakeHistoWGSL });

    const pipeline = await 设备.createComputePipelineAsync({
        layout: 'auto',
        compute: { module: shaderModule, entryPoint: 'main' },
    });

    const targetTotalPixels = target.width * target.height;
    const inputTotalPixels = input.width * input.height;
    const paddedTargetPixels = 是否为2的幂(targetTotalPixels) ? targetTotalPixels : 计算最小2的幂(targetTotalPixels);

    // --- 准备数据和缓冲区 ---
    // 显式创建新的Float32Array以确保其底层为ArrayBuffer, 满足writeBuffer的类型要求
    const targetPixelsData = new Float32Array(target.data);
    const inputPixelsData = new Float32Array(input.data);

    // WGSL的mat3x3是列主序的，而JS传入的是行主序的行向量数组。
    // 因此，我们需要在CPU端先进行转置，再填充到缓冲区中，以匹配WGSL的内存布局。
    const eigenVectorsTransposed = [
        eigenVectors[0][0], eigenVectors[1][0], eigenVectors[2][0], 0,
        eigenVectors[0][1], eigenVectors[1][1], eigenVectors[2][1], 0,
        eigenVectors[0][2], eigenVectors[1][2], eigenVectors[2][2], 0,
    ];
    const eigenVectorsDataAligned = new Float32Array(eigenVectorsTransposed);

    const targetPixelsBuffer = 设备.createBuffer({ size: targetPixelsData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const inputPixelsBuffer = 设备.createBuffer({ size: inputPixelsData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    const eigenVectorsBuffer = 设备.createBuffer({ size: eigenVectorsDataAligned.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    const projectedValuesBuffer = 设备.createBuffer({
        size: paddedTargetPixels * 3 * 4, // f32
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    const outputPixelsBuffer = 设备.createBuffer({
        size: inputPixelsData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    设备.queue.writeBuffer(targetPixelsBuffer, 0, targetPixelsData);
    设备.queue.writeBuffer(inputPixelsBuffer, 0, inputPixelsData);
    设备.queue.writeBuffer(eigenVectorsBuffer, 0, eigenVectorsDataAligned);

    const commandEncoder = 设备.createCommandEncoder();

    // --- Pass 1: 投影 ---
    const projParamsBuffer = 设备.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const projParamsData = new Uint32Array([0, 0, 0, paddedTargetPixels, 0, inputTotalPixels, targetTotalPixels]);
    设备.queue.writeBuffer(projParamsBuffer, 0, projParamsData);
    const projBindGroup = 设备.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: targetPixelsBuffer } }, { binding: 1, resource: { buffer: inputPixelsBuffer } },
            { binding: 2, resource: { buffer: projectedValuesBuffer } }, { binding: 3, resource: { buffer: outputPixelsBuffer } },
            { binding: 4, resource: { buffer: eigenVectorsBuffer } }, { binding: 5, resource: { buffer: projParamsBuffer } },
        ],
    });
    const pass1 = commandEncoder.beginComputePass();
    pass1.setPipeline(pipeline);
    pass1.setBindGroup(0, projBindGroup);
    pass1.dispatchWorkgroups(Math.ceil(paddedTargetPixels / 256));
    pass1.end();

    // --- Pass 2: 排序 ---
    const totalInvocations = Math.ceil(paddedTargetPixels / 256) * 256;
    for (let k = 2; k <= paddedTargetPixels; k <<= 1) {
        for (let j = k >> 1; j > 0; j = j >> 1) {
            const sortParamsBuffer = 设备.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
            const sortParamsData = new Uint32Array([1, k, j, paddedTargetPixels, totalInvocations, inputTotalPixels, targetTotalPixels]);
            设备.queue.writeBuffer(sortParamsBuffer, 0, sortParamsData);
            const sortBindGroup = 设备.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: targetPixelsBuffer } }, { binding: 1, resource: { buffer: inputPixelsBuffer } },
                    { binding: 2, resource: { buffer: projectedValuesBuffer } }, { binding: 3, resource: { buffer: outputPixelsBuffer } },
                    { binding: 4, resource: { buffer: eigenVectorsBuffer } }, { binding: 5, resource: { buffer: sortParamsBuffer } },
                ],
            });
            const pass2 = commandEncoder.beginComputePass();
            pass2.setPipeline(pipeline);
            pass2.setBindGroup(0, sortBindGroup);
            pass2.dispatchWorkgroups(Math.ceil(paddedTargetPixels / 256));
            pass2.end();
        }
    }

    // --- Pass 3: 映射 & 逆变换 ---
    const mapParamsBuffer = 设备.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const mapParamsData = new Uint32Array([2, 0, 0, paddedTargetPixels, 0, inputTotalPixels, targetTotalPixels]);
    设备.queue.writeBuffer(mapParamsBuffer, 0, mapParamsData);
    const mapBindGroup = 设备.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: targetPixelsBuffer } }, { binding: 1, resource: { buffer: inputPixelsBuffer } },
            { binding: 2, resource: { buffer: projectedValuesBuffer } }, { binding: 3, resource: { buffer: outputPixelsBuffer } },
            { binding: 4, resource: { buffer: eigenVectorsBuffer } }, { binding: 5, resource: { buffer: mapParamsBuffer } },
        ],
    });
    const pass3 = commandEncoder.beginComputePass();
    pass3.setPipeline(pipeline);
    pass3.setBindGroup(0, mapBindGroup);
    pass3.dispatchWorkgroups(Math.ceil(inputTotalPixels / 256));
    pass3.end();

    设备.queue.submit([commandEncoder.finish()]);
    await 设备.queue.onSubmittedWorkDone();

    // --- 结果回读 ---
    const readBuffer = 设备.createBuffer({ size: outputPixelsBuffer.size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const copyEncoder = 设备.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(outputPixelsBuffer, 0, readBuffer, 0, outputPixelsBuffer.size);
    设备.queue.submit([copyEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const finalData = new Float32Array(readBuffer.getMappedRange().slice(0));
    readBuffer.unmap();

    // --- 清理 ---
    targetPixelsBuffer.destroy(); inputPixelsBuffer.destroy(); eigenVectorsBuffer.destroy();
    projectedValuesBuffer.destroy(); outputPixelsBuffer.destroy(); readBuffer.destroy();

    return { data: finalData, width: input.width, height: input.height };
}

export async function unmakeHistoGaussianEigen(input: 图像输入, target: 图像输入, eigenVectors: number[][]): Promise<图像输入> {
    // GPU实现
    try {
        const inputGPU: WebGPU图像数据数组RGBA = { ...input, data: new Float32Array(input.data) };
        const targetGPU: WebGPU图像数据数组RGBA = { ...target, data: new Float32Array(target.data) };

        const resultGPU = await unmakeHistoGaussianEigenWebGPU(inputGPU, targetGPU, eigenVectors);
        return { ...resultGPU, data: Array.from(resultGPU.data) };
    } catch (error) {
        // 如果GPU失败，回退到CPU实现
        console.error(error)
        return unmakeHistoGaussianEigenCPU(input, target, eigenVectors);
    }
}
