import { PipelineData } from '@/types/PipelineData.type';
import { gpuBufferToImageData } from '@/utils/webgpu/convert/gpuBufferToImageData';
import { makeTileable } from '../../../src/lib/HistogramPreservingBlendMakeTileable';
import { ImageProcessPipelineStep, PipelineOptions, imageDataToGPUBuffer } from './imageProcessor';
import { getWebGPUDevice } from '../../../src/utils/webgpuDevice';

/**
 * 步骤 3: 可平铺化处理
 */
export class TileableProcessStep implements ImageProcessPipelineStep {
  async execute(data: PipelineData, options: PipelineOptions): Promise<PipelineData> {
    // 当 borderSize 为 0 时，不进行无缝化处理，直接返回原始数据
    if (options.borderSize === 0) {
      return data;
    }

    const device = await getWebGPUDevice();

    // 将 GPUBuffer 转换为 ImageData（内部处理需要）
    const imageData = await gpuBufferToImageData(data.buffer, data.width, data.height, device);

    // 处理图像（可平铺化）
    const processedImageData = await makeTileable(imageData, options.borderSize!, null);

    // 转换回 GPUBuffer
    const processedBuffer = await imageDataToGPUBuffer(processedImageData, device);

    // 销毁旧的 buffer
    data.buffer.destroy();

    return {
      buffer: processedBuffer,
      width: processedImageData.width,
      height: processedImageData.height
    };
  }
}
