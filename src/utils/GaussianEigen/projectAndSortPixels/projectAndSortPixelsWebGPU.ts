/// <reference types="@webgpu/types" />
import projectAndSortPixelsWGSL from './projectAndSortPixels.wgsl?raw';
import { 获取WebGPU设备 } from '../../webgpuDevice';
import type { 图像输入 } from '../../../types/imageProcessing';
import type { 投影结果 } from './projectAndSortPixelsTypes';
import { 创建并映射缓冲区 } from './projectAndSortPixelsTypes';
import { 排序像素偏移 } from './channeled-sort-kv';

const WORKGROUP_SIZE = 16;

/**
 * 使用 WebGPU 执行像素投影和排序操作。
 * @param 设备 - GPUDevice 实例
 * @param input - 输入的图像数据
 * @param eigenVectors - 特征向量矩阵
 * @returns 投影和排序结果
 */
const 执行像素投影和排序 = async (
  设备: GPUDevice,
  input: 图像输入,
  eigenVectors: number[][]
): Promise<投影结果> => {
  const { width, height } = input;
  const totalPixels = width * height;

  // 准备输入数据 - 直接使用RGBA格式的扁平数据结构
  const dataRGBAFloat32 = new Float32Array(input.data);
  const flatEigenVectors = new Float32Array(eigenVectors.flat());

  // 创建着色器模块
  const shaderModule = 设备.createShaderModule({
    code: projectAndSortPixelsWGSL,
    label: "像素投影和排序着色器模块"
  });

  // 创建 uniform 缓冲区
  const uniformData = new Uint32Array([width, height]);
  const uniformBuffer = 设备.createBuffer({
    size: uniformData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
    label: "像素投影和排序Uniform缓冲区"
  });
  new Uint32Array(uniformBuffer.getMappedRange()).set(uniformData);
  uniformBuffer.unmap();

  // 创建输入缓冲区 - 使用单一RGBA缓冲区替代三个分离的RGB缓冲区
  const inputBufferRGBA = 创建并映射缓冲区(设备, dataRGBAFloat32, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, "像素投影和排序RGBA输入缓冲区");
  const eigenVectorsBuffer = 创建并映射缓冲区(设备, flatEigenVectors, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, "像素投影和排序特征向量缓冲区");

  // 创建输出缓冲区 - 直接创建适合排序的格式
  const outputValuesBuffer = 设备.createBuffer({
    size: totalPixels * 3 * 4, // 3个通道，每个f32占4字节
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    label: "像素投影和排序值输出缓冲区"
  });
  const outputOffsetsBuffer = 设备.createBuffer({
    size: totalPixels * 3 * 4, // 3个通道，每个u32占4字节
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    label: "像素投影和排序偏移输出缓冲区"
  });

  // 创建绑定组布局
  const bindGroupLayout = 设备.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
    label: "像素投影和排序绑定组布局"
  });

  // 创建绑定组
  const bindGroup = 设备.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: inputBufferRGBA } },
      { binding: 1, resource: { buffer: eigenVectorsBuffer } },
      { binding: 2, resource: { buffer: outputValuesBuffer } },
      { binding: 3, resource: { buffer: outputOffsetsBuffer } },
      { binding: 4, resource: { buffer: uniformBuffer } },
    ],
    label: "像素投影和排序绑定组"
  });

  // 创建计算管线
  const computePipeline = 设备.createComputePipeline({
    layout: 设备.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
      label: "像素投影和排序管线布局"
    }),
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
    label: "像素投影和排序计算管线"
  });

  // 执行计算
  const commandEncoder = 设备.createCommandEncoder({
    label: "像素投影和排序命令编码器"
  });
  const passEncoder = commandEncoder.beginComputePass({
    label: "像素投影和排序计算通道"
  });
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);

  // 使用二维调度以避免超出单个维度的最大workgroup限制
  const workgroupCountX = Math.ceil(width / WORKGROUP_SIZE);
  const workgroupCountY = Math.ceil(height / WORKGROUP_SIZE);
  passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
  passEncoder.end();

  设备.queue.submit([commandEncoder.finish()]);
  await 设备.queue.onSubmittedWorkDone();

  // 直接从GPU缓冲区读取数据并传递给排序函数
  const readBufferValues = 设备.createBuffer({
    size: totalPixels * 3 * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    label: "像素投影值数据读取缓冲区"
  });
  const readBufferOffsets = 设备.createBuffer({
    size: totalPixels * 3 * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    label: "像素投影偏移数据读取缓冲区"
  });

  const copyCommandEncoder = 设备.createCommandEncoder({
    label: "像素投影数据复制命令编码器"
  });
  copyCommandEncoder.copyBufferToBuffer(outputValuesBuffer, 0, readBufferValues, 0, totalPixels * 3 * 4);
  copyCommandEncoder.copyBufferToBuffer(outputOffsetsBuffer, 0, readBufferOffsets, 0, totalPixels * 3 * 4);
  设备.queue.submit([copyCommandEncoder.finish()]);
  await 设备.queue.onSubmittedWorkDone();

  await Promise.all([
    readBufferValues.mapAsync(GPUMapMode.READ),
    readBufferOffsets.mapAsync(GPUMapMode.READ)
  ]);

  const valuesArrayBuffer = readBufferValues.getMappedRange();
  const offsetsArrayBuffer = readBufferOffsets.getMappedRange();

  // 创建数据副本以避免内存问题
  const valuesDataCopy = new Float32Array(valuesArrayBuffer.slice(0));
  const offsetsDataCopy = new Uint32Array(offsetsArrayBuffer.slice(0));

  readBufferValues.unmap();
  readBufferOffsets.unmap();

  // 直接使用交织格式数据，无需转换
  const channelCount = 3; // 当前使用RGB三通道

  // 使用新的通用排序函数
  const sortedOffsets = await 排序像素偏移(valuesDataCopy, offsetsDataCopy, channelCount);

  return sortedOffsets;
};

/**
 * 导出函数，获取 WebGPU 设备并执行像素投影和排序。
 * @param input - 输入的图像数据
 * @param eigenVectors - 特征向量矩阵
 * @returns 投影和排序结果
 */
export const projectAndSortPixels = async (
  input: 图像输入,
  eigenVectors: number[][]
): Promise<投影结果> => {
  const 设备 = await 获取WebGPU设备();
  return 执行像素投影和排序(设备, input, eigenVectors);
};
