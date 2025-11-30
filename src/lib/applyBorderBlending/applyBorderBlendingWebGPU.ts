/// <reference types="@webgpu/types" />
import applyBorderBlendingWGSL from './applyBorderBlending.wgsl?raw';
import { 获取WebGPU设备 } from '../../utils/webgpuDevice';
import type { WebGPU图像数据数组RGB } from '../../types/imageProcessing';

const WORKGROUP_SIZE = 16;

/**
 * 创建并映射一个 GPU 缓冲区。
 * @param 设备 - GPUDevice 实例
 * @param data - 用于填充缓冲区的数据
 * @param usage - 缓冲区的用途标志
 * @returns 创建的 GPUBuffer
 */
const 创建并映射缓冲区 = (设备: GPUDevice, data: Float32Array, usage: GPUBufferUsageFlags): GPUBuffer => {
  // 验证数据有效性
  if (!data || data.length === 0) {
    throw new Error('创建缓冲区失败: 输入数据为空或长度为0');
  }
  const buffer = 设备.createBuffer({
    size: data.byteLength,
    usage,
    mappedAtCreation: true,
  });
  new Float32Array(buffer.getMappedRange()).set(data);
  buffer.unmap();
  return buffer;
};

/**
 * 使用 WebGPU 执行边界混合操作。
 * 这是一个纯函数，不依赖任何外部状态。
 * @param 设备 - GPUDevice 实例
 * @param imageInputGaussian - 输入的高斯模糊图像数据 (RGB格式)
 * @param targetWidth - 目标宽度 (必须是正整数)
 * @param targetHeight - 目标高度 (必须是正整数)
 * @param borderSize - 边界大小
 * @returns 处理后的图像数据 (RGB格式)
 */
const 执行边界混合 = async (
  设备: GPUDevice,
  imageInputGaussian: WebGPU图像数据数组RGB,
  targetWidth: number,
  targetHeight: number,
  borderSize: number
): Promise<WebGPU图像数据数组RGB> => {
  // 参数验证
  if (!Number.isInteger(targetWidth) || targetWidth <= 0) {
    throw new Error(`Invalid targetWidth: ${targetWidth}. It must be a positive integer.`);
  }
  if (!Number.isInteger(targetHeight) || targetHeight <= 0) {
    throw new Error(`Invalid targetHeight: ${targetHeight}. It must be a positive integer.`);
  }
  if (borderSize <= 0) {
    throw new Error(`Invalid borderSize: ${borderSize}. It must be a positive number.`);
  }
  if (!imageInputGaussian || !(imageInputGaussian.data instanceof Float32Array)) {
    throw new Error('Invalid imageInputGaussian: It must be an object with data as Float32Array.');
  }

  const expectedDataLength = targetWidth * targetHeight * 3; // RGB格式，每个像素3个值
  if (imageInputGaussian.data.length !== expectedDataLength) {
    throw new Error(`Data length mismatch. Expected ${expectedDataLength}, got ${imageInputGaussian.data.length}`);
  }

  const shaderModule = 设备.createShaderModule({ code: applyBorderBlendingWGSL });

  const uniformData = new Float32Array([targetWidth, targetHeight, borderSize]);
  const uniformBuffer = 创建并映射缓冲区(设备, uniformData, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

  // 直接使用RGB格式的数据创建缓冲区
  const inputBuffer = 创建并映射缓冲区(设备, imageInputGaussian.data, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);

  // 输出缓冲区大小与输入相同
  const bufferSize = imageInputGaussian.data.byteLength;
  const outputBuffer = 设备.createBuffer({ size: bufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });

  const bindGroupLayout = 设备.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  });

  const bindGroup = 设备.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: inputBuffer } },
      { binding: 1, resource: { buffer: outputBuffer } },
      { binding: 2, resource: { buffer: uniformBuffer } },
    ],
  });

  const computePipeline = 设备.createComputePipeline({
    layout: 设备.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  const commandEncoder = 设备.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);

  const workgroupCountX = Math.ceil(targetWidth / WORKGROUP_SIZE);
  const workgroupCountY = Math.ceil(targetHeight / WORKGROUP_SIZE);
  passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
  passEncoder.end();

  const readBuffer = 设备.createBuffer({ size: bufferSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });

  commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, bufferSize);

  设备.queue.submit([commandEncoder.finish()]);
  await 设备.queue.onSubmittedWorkDone();

  await readBuffer.mapAsync(GPUMapMode.READ);

  const resultData = new Float32Array(readBuffer.getMappedRange().slice(0));

  readBuffer.unmap();

  return {
    data: resultData,
    width: targetWidth,
    height: targetHeight
  };
};

/**
 * 导出函数，获取 WebGPU 设备并执行边界混合。
 * @param imageInputGaussian - 输入的图像数据 (WebGPU图像数据数组RGB格式)
 * @param targetWidth - 目标宽度
 * @param targetHeight - 目标高度
 * @param borderSize - 边界大小
 * @returns 处理后的图像数据 (WebGPU图像数据数组RGB格式)
 */
export const applyBorderBlendingWebGPU = async (
  imageInputGaussian: WebGPU图像数据数组RGB,
  targetWidth: number,
  targetHeight: number,
  borderSize: number
): Promise<WebGPU图像数据数组RGB> => {
  const 设备 = await 获取WebGPU设备();

  // 直接执行边界混合，无需转换
  return await 执行边界混合(设备, imageInputGaussian, targetWidth, targetHeight, borderSize);
};

// 导出原始函数名以保持兼容性
export const applyBorderBlending = applyBorderBlendingWebGPU;