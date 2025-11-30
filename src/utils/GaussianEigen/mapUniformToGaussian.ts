import { GPU } from 'gpu.js';
import type { 图像输入 } from "../../types/imageProcessing";

// GPU.js 实例可以在模块级别缓存，避免重复初始化
let gpu: GPU | null = null;
try {
    gpu = new GPU();
} catch (e) {
    console.error('GPU.js 初始化失败:', e);
    gpu = null;
}

// erfinv 函数的纯 JS 实现，以便在 gpu.js 不可用时回退
const erfinv = (x: number): number => {
    let w = 0;
    let p = 0;
    w = -Math.log((1.0 - x) * (1.0 + x));
    if (w < 5.0) {
        w = w - 2.5;
        p = 2.81022636e-08;
        p = 3.43273939e-07 + p * w;
        p = -3.5233877e-06 + p * w;
        p = -4.39150654e-06 + p * w;
        p = 0.00021858087 + p * w;
        p = -0.00125372503 + p * w;
        p = -0.00417768164 + p * w;
        p = 0.246640727 + p * w;
        p = 1.50140941 + p * w;
    } else {
        w = Math.sqrt(w) - 3.0;
        p = -0.000200214257;
        p = 0.000100950558 + p * w;
        p = 0.00134934322 + p * w;
        p = -0.00367342844 + p * w;
        p = 0.00573950773 + p * w;
        p = -0.0076224613 + p * w;
        p = 0.00943887047 + p * w;
        p = 1.00167406 + p * w;
        p = 2.83297682 + p * w;
    }
    return p * x;
};

const 生成高斯值 = (totalPixels: number): Float32Array => {
    const gaussianValues = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
        const U = (i + 0.5) / totalPixels;
        gaussianValues[i] = Math.sqrt(2.0) * erfinv(2 * U - 1.0);
    }
    return gaussianValues;
};

const 生成高斯值GPU = (totalPixels: number): Float32Array => {
    if (!gpu) {
        console.warn("GPU.js 不可用，回退到 CPU 计算高斯值。");
        return 生成高斯值(totalPixels);
    }
    const kernel = gpu.createKernel(function (totalPixels: number) {
        // erfinv 函数必须在内核函数内部定义
        function erfinv(x: number): number {
            let w = 0;
            let p = 0;
            w = -Math.log((1.0 - x) * (1.0 + x));
            if (w < 5.0) {
                w = w - 2.5;
                p = 2.81022636e-08;
                p = 3.43273939e-07 + p * w;
                p = -3.5233877e-06 + p * w;
                p = -4.39150654e-06 + p * w;
                p = 0.00021858087 + p * w;
                p = -0.00125372503 + p * w;
                p = -0.00417768164 + p * w;
                p = 0.246640727 + p * w;
                p = 1.50140941 + p * w;
            } else {
                w = Math.sqrt(w) - 3.0;
                p = -0.000200214257;
                p = 0.000100950558 + p * w;
                p = 0.00134934322 + p * w;
                p = -0.00367342844 + p * w;
                p = 0.00573950773 + p * w;
                p = -0.0076224613 + p * w;
                p = 0.00943887047 + p * w;
                p = 1.00167406 + p * w;
                p = 2.83297682 + p * w;
            }
            return p * x;
        }
        const U = (this.thread.x + 0.5) / totalPixels;
        return Math.sqrt(2.0) * erfinv(2 * U - 1.0);
    }, {
        output: [totalPixels],
        precision: 'single'
    });

    return kernel(totalPixels) as Float32Array;
};

export function mapUniformToGaussian(input: 图像输入, RGBOffsets: Uint32Array, output: 图像输入): void {
    const width = input.width;
    const height = input.height;
    const totalPixels = width * height;

    // 1. 生成有序的高斯值数组
    const gaussianValues = 生成高斯值GPU(totalPixels);

    // 2. 创建从 "像素索引" 到 "亮度排名" 的逆向映射并直接应用高斯值
    // 使用一个数组来记录每个像素的RGB通道是否已经处理过
    const processedChannels = new Uint8Array(totalPixels);
    
    // 在一次遍历中完成映射和赋值，同时复制alpha值
    for (let rank = 0; rank < totalPixels; rank++) {
        const pixelIndexR = RGBOffsets[rank * 3];
        const pixelIndexG = RGBOffsets[rank * 3 + 1];
        const pixelIndexB = RGBOffsets[rank * 3 + 2];
        
        // 获取高斯值
        const gaussianValue = gaussianValues[rank];
        
        // 防止填充的无限值（其偏移量可能为0）覆盖有效值
        if (pixelIndexR < totalPixels && (processedChannels[pixelIndexR] & 1) === 0) {
            const dataIndex = pixelIndexR * 4;
            output.data[dataIndex] = gaussianValue;
            // 如果是第一次处理该像素，复制alpha值
            if (processedChannels[pixelIndexR] === 0) {
                output.data[dataIndex + 3] = input.data[dataIndex + 3];
            }
            processedChannels[pixelIndexR] |= 1; // 标记R通道已处理
        }
        
        if (pixelIndexG < totalPixels && (processedChannels[pixelIndexG] & 2) === 0) {
            const dataIndex = pixelIndexG * 4;
            output.data[dataIndex + 1] = gaussianValue;
            // 如果是第一次处理该像素，复制alpha值
            if (processedChannels[pixelIndexG] === 0) {
                output.data[dataIndex + 3] = input.data[dataIndex + 3];
            }
            processedChannels[pixelIndexG] |= 2; // 标记G通道已处理
        }
        
        if (pixelIndexB < totalPixels && (processedChannels[pixelIndexB] & 4) === 0) {
            const dataIndex = pixelIndexB * 4;
            output.data[dataIndex + 2] = gaussianValue;
            // 如果是第一次处理该像素，复制alpha值
            if (processedChannels[pixelIndexB] === 0) {
                output.data[dataIndex + 3] = input.data[dataIndex + 3];
            }
            processedChannels[pixelIndexB] |= 4; // 标记B通道已处理
        }
    }
}
