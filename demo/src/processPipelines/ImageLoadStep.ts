import { PipelineData } from '@/types/PipelineData.type';
import { scaleImageToMaxResolution } from '@/utils/imageLoader';
import { ImageProcessPipelineStep, PipelineOptions, getGPUDevice, imageDataToGPUBuffer } from './imageProcessor';

/**
 * 步骤 1: 图像加载和缩放
 */
export class ImageLoadStep implements ImageProcessPipelineStep {
  async execute(data: PipelineData, options: PipelineOptions): Promise<PipelineData> {
    // 这是管线的第一步，data 参数实际上不会被使用
    // 我们需要从外部传入的 originalImage 加载图像
    throw new Error('ImageLoadStep 需要特殊处理，不能直接在管线中使用');
  }

  /**
   * 从图像 URL 加载并缩放图像
   */
  async loadAndScale(originalImage: string, maxResolution: number): Promise<PipelineData> {
    const device = await getGPUDevice();

    // 创建图像元素
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('图像加载失败'));
      img.src = originalImage;
    });

    // 缩放图像到最大分辨率
    const scaledCanvas = scaleImageToMaxResolution(img, maxResolution);
    const imageData = scaledCanvas.getContext('2d')!.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);

    // 转换为 GPUBuffer
    const buffer = await imageDataToGPUBuffer(imageData, device);

    return {
      buffer,
      width: imageData.width,
      height: imageData.height
    };
  }
}
