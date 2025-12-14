/**
 * 直方图分析相关函数
 */
import type { ExposureAdjustmentParams, HistogramFeatures } from './exposureAdjustment.types'

/** 计算图像直方图 */
export function calculateHistogram(imageData: ImageData): Uint32Array {
    const histogram = new Uint32Array(256)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        // 计算亮度值 (使用标准权重)
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        histogram[luminance]++
    }

    return histogram
}

/** 分析直方图特征 */
export function analyzeHistogramFeatures(histogram: Uint32Array): HistogramFeatures {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0)

    // 找到最大值和最小值的位置
    let maxBin = 0
    let maxCount = 0
    let darkPixels = 0
    let brightPixels = 0

    for (let i = 0; i < 256; i++) {
        if (histogram[i] > maxCount) {
            maxCount = histogram[i]
            maxBin = i
        }

        if (i < 64) {
            darkPixels += histogram[i]
        }
        if (i > 192) {
            brightPixels += histogram[i]
        }
    }

    return {
        peakBin: maxBin / 255.0,
        darkRatio: darkPixels / totalPixels,
        brightRatio: brightPixels / totalPixels
    }
}

/** 计算方差 */
export function calculateVariance(histogram: Uint32Array, mean: number, totalPixels: number): number {
    let variance = 0
    for (let i = 0; i < 256; i++) {
        const normalizedValue = i / 255.0
        const diff = normalizedValue - mean
        variance += (diff * diff) * histogram[i]
    }
    return variance / totalPixels
}

/** 计算局部调整因子 */
export function calculateLocalAdjustFactor(variance: number): number {
    // 基于方差调整局部因子
    // 方差越大，说明图像对比度越高，需要更温和的调整
    const baseAdjustment = 1.0
    const varianceWeight = Math.min(variance * 4.0, 1.0)
    return baseAdjustment * (1.0 - varianceWeight * 0.5)
}

/** 计算曝光调整参数 */
export function calculateExposureParams(histogram: Uint32Array): ExposureAdjustmentParams {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0)

    // 计算平均亮度
    let weightedSum = 0
    for (let i = 0; i < 256; i++) {
        weightedSum += (i / 255.0) * histogram[i]
    }
    const averageLuminance = weightedSum / totalPixels

    // 根据特征调整目标曝光值
    let targetExposure = 0.5 - averageLuminance

    // 分析直方图特征
    const features = analyzeHistogramFeatures(histogram)

    // 如果有明显的峰值，向该方向适当调整
    if (features.peakBin < 0.3) {
        // 暗部有峰值，增加曝光补偿
        targetExposure *= 1.2
    } else if (features.peakBin > 0.7) {
        // 亮部有峰值，减少曝光补偿
        targetExposure *= 0.8
    }

    // 计算局部调整因子
    const variance = calculateVariance(histogram, averageLuminance, totalPixels)
    let localAdjustFactor = calculateLocalAdjustFactor(variance)

    // 根据特征调整局部因子
    if (features.darkRatio > 0.4 || features.brightRatio > 0.4) {
        // 在极端情况下减少局部调整以避免过度处理
        localAdjustFactor *= 0.8
    }

    return {
        strength: 1.0,
        targetExposure,
        localAdjustFactor
    }
}

/** 计算 CDF（累积分布函数） */
export function calculateCDF(histogram: Uint32Array): Float32Array {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0)
    const cdf = new Float32Array(256)
    let sum = 0
    for (let i = 0; i < 256; i++) {
        sum += histogram[i]
        cdf[i] = sum / totalPixels
    }
    return cdf
}
