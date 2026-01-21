// @fileoverview CLAHE 算法主入口
// @author 织

import { generateCLAHEShaders } from './clahe-shaders.js';

/**
 * CLAHE 算法参数类型
 * @typedef {Object} CLAHEParams
 * @property {number} clipLimit 对比度限制 [1.0, 4.0]
 * @property {number} blockSize 分块大小 [32, 64, 128]
 * @property {number} numBins 直方图bin数 [128, 256]
 */

/**
 * 创建CLAHE参数uniform缓冲区
 * @param {GPUDevice} device WebGPU设备
 * @param {CLAHEParams} params 算法参数
 * @param {number} width 纹理宽度
 * @param {number} height 纹理高度
 * @returns {GPUBuffer} uniform缓冲区
 */
export function createCLAHEUniformBuffer(device, params, width, height) {
  const bufferData = new ArrayBuffer(20); // 5个u32/f32
  const view = new DataView(bufferData);
  view.setUint32(0, width, true);
  view.setUint32(4, height, true);
  view.setFloat32(8, params.clipLimit, true);
  view.setUint32(12, params.blockSize, true);
  view.setUint32(16, params.numBins, true);
  const uniformBuffer = device.createBuffer({
    size: 20,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    label: 'CLAHE Uniform Buffer'
  });
  device.queue.writeBuffer(uniformBuffer, 0, bufferData);
  return uniformBuffer;
}

/**
 * CLAHE 算法主函数
 * @param {GPUDevice} device WebGPU 设备
 * @param {GPUTexture} inputTexture 输入纹理
 * @param {CLAHEParams} params 算法参数
 * @returns {Promise<GPUTexture>} 输出增强后的纹理
 */
export async function clahe(device, inputTexture, params) {
  // 参数校验
  const { clipLimit = 2.0, blockSize = 64, numBins = 256 } = params || {};
  if (clipLimit < 1.0 || clipLimit > 4.0) throw new Error('clipLimit超出范围');
  if (![32, 64, 128].includes(blockSize)) throw new Error('blockSize不合法');
  if (![128, 256].includes(numBins)) throw new Error('numBins不合法');

  // 获取输入纹理尺寸
  const width = inputTexture.width || inputTexture.size?.width;
  const height = inputTexture.height || inputTexture.size?.height;
  if (!width || !height) throw new Error('无法获取输入纹理尺寸');

  // 生成四阶段WGSL着色器
  const shaders = generateCLAHEShaders({ clipLimit, blockSize, numBins });

  // 1. 创建资源
  // 直方图缓冲区
  const numBlocksX = Math.ceil(width / blockSize);
  const numBlocksY = Math.ceil(height / blockSize);
  const numBlocks = numBlocksX * numBlocksY;
  const histogramBufferSize = numBlocks * numBins * 4 * 4; // 4通道，每bin 4字节
  const histogramBuffer = device.createBuffer({
    size: histogramBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    label: 'CLAHE Histogram Buffer'
  });
  // 对比度溢出缓冲区
  const excessBuffer = device.createBuffer({
    size: numBlocks * 4 * 4, // 每块4通道
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    label: 'CLAHE Excess Buffer'
  });
  // LUT纹理
  const lutTexture = device.createTexture({
    size: { width: numBins, height: numBlocks * 4 },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    label: 'CLAHE LUT Texture'
  });
  // 输出纹理
  const outputTexture = device.createTexture({
    size: { width, height },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    label: 'CLAHE Output Texture'
  });
  // uniform缓冲区
  const uniformBuffer = createCLAHEUniformBuffer(device, { clipLimit, blockSize, numBins }, width, height);

  // 2. 创建各阶段管线
  function createPipeline(shaderCode, bindings, label) {
    const shaderModule = device.createShaderModule({ code: shaderCode });
    const bindGroupLayout = device.createBindGroupLayout({ entries: bindings });
    const pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      compute: { module: shaderModule, entryPoint: 'main' },
      label
    });
    return { pipeline, bindGroupLayout };
  }

  // 直方图计算
  const histogramBindings = [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
  ];
  const { pipeline: histogramPipeline, bindGroupLayout: histogramLayout } = createPipeline(shaders.histogramShader, histogramBindings, 'CLAHE Histogram Pipeline');
  // 对比度限制
  const clipBindings = [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
  ];
  const { pipeline: clipPipeline, bindGroupLayout: clipLayout } = createPipeline(shaders.clipShader, clipBindings, 'CLAHE Clip Pipeline');
  // CDF
  const cdfBindings = [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
  ];
  const { pipeline: cdfPipeline, bindGroupLayout: cdfLayout } = createPipeline(shaders.cdfShader, cdfBindings, 'CLAHE CDF Pipeline');
  // LUT应用
  const applyLUTBindings = [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 3, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } }
  ];
  const { pipeline: applyLUTPipeline, bindGroupLayout: applyLUTLayout } = createPipeline(shaders.applyLUTShader, applyLUTBindings, 'CLAHE Apply LUT Pipeline');

  // 3. 创建BindGroup
  const histogramBindGroup = device.createBindGroup({
    layout: histogramLayout,
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: { buffer: histogramBuffer } },
      { binding: 2, resource: { buffer: uniformBuffer } }
    ],
    label: 'CLAHE Histogram BindGroup'
  });
  const clipBindGroup = device.createBindGroup({
    layout: clipLayout,
    entries: [
      { binding: 0, resource: { buffer: histogramBuffer } },
      { binding: 1, resource: { buffer: excessBuffer } },
      { binding: 2, resource: { buffer: uniformBuffer } }
    ],
    label: 'CLAHE Clip BindGroup'
  });
  const cdfBindGroup = device.createBindGroup({
    layout: cdfLayout,
    entries: [
      { binding: 0, resource: { buffer: histogramBuffer } },
      { binding: 1, resource: lutTexture.createView() },
      { binding: 2, resource: { buffer: uniformBuffer } }
    ],
    label: 'CLAHE CDF BindGroup'
  });
  const applyLUTBindGroup = device.createBindGroup({
    layout: applyLUTLayout,
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: lutTexture.createView() },
      { binding: 2, resource: { buffer: uniformBuffer } },
      { binding: 3, resource: outputTexture.createView() }
    ],
    label: 'CLAHE Apply LUT BindGroup'
  });

  // 4. 调度四阶段
  const encoder = device.createCommandEncoder({ label: 'CLAHE Encoder' });
  // 阶段1：直方图
  {
    const pass = encoder.beginComputePass({ label: 'CLAHE Histogram Pass' });
    pass.setPipeline(histogramPipeline);
    pass.setBindGroup(0, histogramBindGroup);
    pass.dispatchWorkgroups(numBlocksX * blockSize / blockSize, numBlocksY * blockSize / blockSize);
    pass.end();
  }
  // 阶段2：对比度限制
  {
    const pass = encoder.beginComputePass({ label: 'CLAHE Clip Pass' });
    pass.setPipeline(clipPipeline);
    pass.setBindGroup(0, clipBindGroup);
    pass.dispatchWorkgroups(numBlocks * numBins * 4 / numBins, 1);
    pass.end();
  }
  // 阶段3：CDF
  {
    const pass = encoder.beginComputePass({ label: 'CLAHE CDF Pass' });
    pass.setPipeline(cdfPipeline);
    pass.setBindGroup(0, cdfBindGroup);
    pass.dispatchWorkgroups(numBlocks * numBins * 4 / numBins, 1);
    pass.end();
  }
  // 阶段4：LUT应用
  {
    const pass = encoder.beginComputePass({ label: 'CLAHE Apply LUT Pass' });
    pass.setPipeline(applyLUTPipeline);
    pass.setBindGroup(0, applyLUTBindGroup);
    pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16));
    pass.end();
  }
  device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  return outputTexture;
}

/**
 * 生成CLAHE四阶段WGSL着色器
 * 
 * @param {CLAHEParams} params 算法参数
 * @returns {Object} 四阶段WGSL代码
 */
export { generateCLAHEShaders };
