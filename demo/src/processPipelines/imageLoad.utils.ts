import type { PipelineData } from './imports';
import { scaleImageToMaxResolution } from './imports';
import { imageDataToGPUBuffer } from './imageProcessor.utils';
import { getWebGPUDevice } from './imports';

/**
 * 从图像 URL 加载并缩放图像
 */
export async function loadAndScaleImage(
    originalImage: string,
    maxResolution: number
): Promise<PipelineData> {
    const device = await getWebGPUDevice();

    // 创建图像元素
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
        img.onload = (): void => resolve();
        img.onerror = (): void => reject(new Error('图像加载失败'));
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
