import type { PipelineData } from './imports';
import { scaleImageToMaxResolution } from './imports';
import { imageDataToGPUBuffer } from './imageProcessor.utils';
import { getWebGPUDevice } from './imports';

/**
 * 图像加载缓存
 * 
 * 缓存已加载和缩放后的 ImageData，避免每次处理都重新解码图片
 */
let 当前缓存: {
    /** 原始图像 URL（用于缓存命中判断） */
    原图URL: string
    /** 最大分辨率（用于缓存命中判断） */
    最大分辨率: number
    /** 缓存的 ImageData */
    imageData: ImageData
} | null = null

/**
 * 从图像 URL 加载并缩放图像
 * 
 * 带缓存优化：如果原图和分辨率都没变，直接复用缓存的 ImageData
 */
export async function loadAndScaleImage(
    originalImage: string,
    maxResolution: number
): Promise<PipelineData> {
    const device = await getWebGPUDevice();

    // 检查缓存命中
    if (当前缓存 &&
        当前缓存.原图URL === originalImage &&
        当前缓存.最大分辨率 === maxResolution) {
        // 缓存命中，直接使用缓存的 ImageData 创建新 GPUBuffer
        const buffer = await imageDataToGPUBuffer(当前缓存.imageData, device);
        return {
            buffer,
            width: 当前缓存.imageData.width,
            height: 当前缓存.imageData.height
        };
    }

    // 缓存未命中，重新加载图像
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

    // 更新缓存
    当前缓存 = {
        原图URL: originalImage,
        最大分辨率: maxResolution,
        imageData
    };

    // 转换为 GPUBuffer
    const buffer = await imageDataToGPUBuffer(imageData, device);

    return {
        buffer,
        width: imageData.width,
        height: imageData.height
    };
}

/**
 * 清空图像加载缓存
 * 在切换项目或清空时调用
 * @简洁函数 缓存清理工具函数
 */
export function 清空图像缓存(): void {
    当前缓存 = null;
}

