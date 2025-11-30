import { 获取WebGPU设备 } from "../../../webgpuDevice";
import sortPixelOffsetsGenericWGSL from './sortPixelOffsetsGeneric.wgsl?raw';

const 是否为2的幂 = (n: number): boolean => (n & (n - 1)) === 0 && n !== 0;

const 计算最小2的幂 = (n: number): number => {
    if (n <= 0) return 1;
    let p = 1;
    while (p < n) { p <<= 1; }
    return p;
};

/**
 * 填充数组
 * @param array 要填充的数组
 * @param originalElementCount 原始元素数量
 * @param paddedElementCount 填充后的元素数量
 * @param fillValue 填充值
 * @param channels 通道数
 */
const fillArrayWithValue = (
    array: Float32Array | Uint32Array,
    originalElementCount: number,
    paddedElementCount: number,
    fillValue: number,
    channels: number
): void => {
    for (let i = originalElementCount; i < paddedElementCount; i++) {
        for (let c = 0; c < channels; c++) {
            array[i * channels + c] = fillValue;
        }
    }
};



/**
 * 使用GPU对像素偏移进行排序（支持任意通道数）
 * @param values 交织格式的多通道值数组
 * @param offsets 交织格式的像素偏移数组
 * @param channelCount 通道数量
 * @returns 排序后的像素偏移
 */
export const 排序像素偏移 = async (
    values: Float32Array,
    offsets: Uint32Array,
    channelCount: number
): Promise<Uint32Array> => {
    const 设备 = await 获取WebGPU设备();
    const originalElementCount = values.length / channelCount;

    let paddedElementCount = originalElementCount;
    if (!是否为2的幂(originalElementCount)) {
        paddedElementCount = 计算最小2的幂(originalElementCount);
    }
    const needsPadding = paddedElementCount !== originalElementCount;

    // 直接使用交织格式数据，如果需要填充则进行填充
    const multiChannelValues = new Float32Array(paddedElementCount * channelCount);
    const multiChannelPixelOffsets = new Uint32Array(paddedElementCount * channelCount);

    // 复制原始数据
    multiChannelValues.set(values);
    multiChannelPixelOffsets.set(offsets);

    // 如果需要填充
    if (needsPadding) {
        fillArrayWithValue(multiChannelValues, originalElementCount, paddedElementCount, Infinity, channelCount);
        fillArrayWithValue(multiChannelPixelOffsets, originalElementCount, paddedElementCount, 0, channelCount);
    }

    const shaderModule = 设备.createShaderModule({ code: sortPixelOffsetsGenericWGSL });
    const computePipeline = 设备.createComputePipeline({
        layout: 设备.createPipelineLayout({
            bindGroupLayouts: [
                设备.createBindGroupLayout({
                    entries: [
                        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                    ],
                })
            ],
        }),
        compute: { module: shaderModule, entryPoint: 'main' },
    });

    const multiChannelValuesBuffer = 设备.createBuffer({
        size: multiChannelValues.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const multiChannelPixelOffsetsBuffer = 设备.createBuffer({
        size: multiChannelPixelOffsets.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });

    设备.queue.writeBuffer(multiChannelValuesBuffer, 0, multiChannelValues);
    设备.queue.writeBuffer(multiChannelPixelOffsetsBuffer, 0, multiChannelPixelOffsets);
    // 确保初始数据写入完成
    await 设备.queue.onSubmittedWorkDone();

    const commandEncoder = 设备.createCommandEncoder();
    const totalInvocations = Math.ceil(paddedElementCount / 256) * 256;
    for (let k = 2; k <= paddedElementCount; k <<= 1) {
        for (let j = k >> 1; j > 0; j = j >> 1) {
            const paramsBuffer = 设备.createBuffer({
                size: 5 * 4, // 5个u32参数，每个占4字节
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                label: `params_k${k}_j${j}`
            });
            设备.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([k, j, paddedElementCount, totalInvocations, channelCount]));

            const bindGroup = 设备.createBindGroup({
                layout: computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: multiChannelValuesBuffer } },
                    { binding: 1, resource: { buffer: multiChannelPixelOffsetsBuffer } },
                    { binding: 2, resource: { buffer: paramsBuffer } }
                ],
                label: `bindGroup_k${k}_j${j}`
            });

            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(Math.ceil(paddedElementCount / 256));
            passEncoder.end();
        }
    }
    设备.queue.submit([commandEncoder.finish()]);
    await 设备.queue.onSubmittedWorkDone();

    const resultBuffer = 设备.createBuffer({
        size: multiChannelPixelOffsets.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const copyEncoder = 设备.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(multiChannelPixelOffsetsBuffer, 0, resultBuffer, 0, multiChannelPixelOffsets.byteLength);
    设备.queue.submit([copyEncoder.finish()]);
    await resultBuffer.mapAsync(GPUMapMode.READ);
    const sortedOffsets = new Uint32Array(resultBuffer.getMappedRange().slice(0));
    resultBuffer.unmap();
    return sortedOffsets;
};
