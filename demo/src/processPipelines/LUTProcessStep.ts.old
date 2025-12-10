import { PipelineData } from '@/types/PipelineData.type';
import { gpuBufferToImageData } from '@/utils/webgpu/convert/gpuBufferToImageData';
import { processLutData, processImageWithLUT } from '@leolee9086/use-lut';
import { ImageProcessPipelineStep, PipelineOptions, imageDataToGPUBuffer } from './imageProcessor';
import { getWebGPUDevice } from '../../../src/utils/webgpuDevice';

/**
 * 步骤 2: LUT 处理
 */
export class LUTProcessStep implements ImageProcessPipelineStep {
  async execute(data: PipelineData, options: PipelineOptions): Promise<PipelineData> {
    // 如果没有 LUT 文件，直接返回原数据
    if (!options.lutFile) {
      return data;
    }

    const device = await getWebGPUDevice();

    try {
      // 将 GPUBuffer 转换为 ImageData（内部处理需要）
      const imageData = await gpuBufferToImageData(data.buffer, data.width, data.height, device);

      // 解析 LUT 文件
      const lutResult = await processLutData(options.lutFile, options.lutFile.name);

      // 准备 maskData 对象
      const maskOptions: any = {
        intensity: options.lutIntensity || 1.0
      };

      if (options.maskData) {
        console.log('🎭 应用蒙版:', imageData);
        maskOptions.maskData = {
          data: options.maskData,
          width: imageData.width,
          height: imageData.height
        };
        maskOptions.maskIntensity = 1.0;
        maskOptions.enableMask = true;
      } else {
        console.log('⚠️ 无蒙版数据');
      }

      // 使用LUT库处理图像
      const processResult = await processImageWithLUT(
        { data: new Uint8Array(imageData.data.buffer), width: imageData.width, height: imageData.height },
        lutResult.data,
        maskOptions
      );

      if (processResult.success && processResult.result) {
        // 更新图像数据为LUT处理后的结果
        const processedImageData = new ImageData(
          new Uint8ClampedArray(processResult.result),
          imageData.width,
          imageData.height
        );

        // 转换回 GPUBuffer
        const processedBuffer = await imageDataToGPUBuffer(processedImageData, device);

        // 销毁旧的 buffer
        data.buffer.destroy();

        return {
          buffer: processedBuffer,
          width: data.width,
          height: data.height
        };
      }
    } catch (error) {
      console.warn('LUT处理失败，继续使用原始图像:', error);
    }

    // LUT 处理失败或未成功时返回原数据
    return data;
  }
}
