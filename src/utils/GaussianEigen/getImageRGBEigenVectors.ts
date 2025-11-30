import * as tf from "@tensorflow/tfjs";
import '@tensorflow/tfjs-backend-webgpu';
import type { 图像输入 } from "../../types/imageProcessing";
import { withPerformanceLogging } from "../performanceRun";
import { computeEigenValuesAndVectors } from "./computeEigenValuesAndVectors";

export async function getImageRGBEigenVectors(input: 图像输入, eigenVectors: number[][]): Promise<number[][]> {
    // 确保 TensorFlow.js WebGPU 后端已初始化
    await tf.setBackend('webgpu');
    await tf.ready();
    // 直接从RGBA数据中提取RGB数据，创建一个二维数组
    const pixelCount = input.data.length / 4; // 每个像素4个值(RGBA)
    
    // 使用Welford算法在一次遍历中计算均值和协方差
    let meanR = 0;
    let meanG = 0;
    let meanB = 0;
    
    // 协方差矩阵的元素 (3x3矩阵)
    let covRR = 0;
    let covRG = 0;
    let covRB = 0;
    let covGG = 0;
    let covGB = 0;
    let covBB = 0;
    
    for (let i = 0; i < pixelCount; i++) {
        const rgbaIndex = i * 4;
        const r = input.data[rgbaIndex];
        const g = input.data[rgbaIndex + 1];
        const b = input.data[rgbaIndex + 2];
        
        // 更新均值
        const deltaR = r - meanR;
        const deltaG = g - meanG;
        const deltaB = b - meanB;
        
        meanR += deltaR / (i + 1);
        meanG += deltaG / (i + 1);
        meanB += deltaB / (i + 1);
        
        // 更新协方差矩阵的元素
        const newDeltaR = r - meanR;
        const newDeltaG = g - meanG;
        const newDeltaB = b - meanB;
        
        if (i > 0) {
            covRR += deltaR * newDeltaR;
            covRG += deltaR * newDeltaG;
            covRB += deltaR * newDeltaB;
            covGG += deltaG * newDeltaG;
            covGB += deltaG * newDeltaB;
            covBB += deltaB * newDeltaB;
        }
    }
    
    // 归一化协方差矩阵
    const normalizationFactor = pixelCount - 1;
    covRR /= normalizationFactor;
    covRG /= normalizationFactor;
    covRB /= normalizationFactor;
    covGG /= normalizationFactor;
    covGB /= normalizationFactor;
    covBB /= normalizationFactor;
    
    // 创建协方差矩阵张量
    const covarMat = tf.tensor2d([
        [covRR, covRG, covRB],
        [covRG, covGG, covGB],
        [covRB, covGB, covBB]
    ]) as tf.Tensor<tf.Rank.R2>;
    
    // 计算特征值和特征向量
    const eigenResult = await withPerformanceLogging(computeEigenValuesAndVectors)(covarMat);
    eigenVectors = eigenResult.eigenVectors;
    
    // 释放张量内存
    covarMat.dispose();
    
    return eigenVectors;
}
