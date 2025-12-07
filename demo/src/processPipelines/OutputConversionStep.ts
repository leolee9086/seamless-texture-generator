import { PipelineData } from '@/types/PipelineData.type';
import { gpuBufferToImageData } from '@/utils/webgpu/convert/gpuBufferToImageData';
import { ImageProcessPipelineStep, PipelineOptions, getGPUDevice } from './imageProcessor';

/**
 * 步骤 4: 输出转换
 */
export class OutputConversionStep implements ImageProcessPipelineStep {
  async execute(data: PipelineData, options: PipelineOptions): Promise<PipelineData> {
    // 这个步骤不修改数据，只是标记管线结束
    // 实际的转换工作在 processImageToTileable 函数中完成
    return data;
  }

  /**
   * 将 GPUBuffer 转换为 DataURL
   */
  async convertToDataURL(data: PipelineData): Promise<string> {
    const device = await getGPUDevice();

    // 将 GPUBuffer 转换为 ImageData
    const imageData = await gpuBufferToImageData(data.buffer, data.width, data.height, device);

    // 将处理后的图像数据转换为URL
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  }
}
