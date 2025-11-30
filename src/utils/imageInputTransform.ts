import type { 图像输入 } from "../types/imageProcessing";

/**
 * 将ImageData对象转换为自定义的图像输入格式。
 * @param {ImageData} imageData - 包含像素数据的ImageData对象。ImageData对象应包含属性width、height和data。
 * @param {function} mapFunc - 用于处理每个通道值的映射函数，默认为恒等函数。该函数接收一个数字参数并返回一个数字。
 * @returns {图像输入} 返回一个包含四个通道数据（红、绿、蓝、Alpha）和图像尺寸的对象。
 */
export const imageDataToImageInput = (imageData: ImageData): 图像输入 => {
    // 直接使用Array.from复制数据，避免不必要的遍历转换
    const data = Array.from(imageData.data);

    return {
        data,
        width: imageData.width,
        height: imageData.height
    };
};


export function emptyImageInput(width: number, height: number): 图像输入 {
    const data: number[] = [];
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
        data.push(0);   // R
        data.push(0);   // G
        data.push(0);   // B
        data.push(255); // A
    }

    return {
        data,
        width,
        height
    };
}