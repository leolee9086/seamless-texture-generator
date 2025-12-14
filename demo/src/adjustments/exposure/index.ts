/**
 * 曝光调整模块出口
 * 
 * 该模块提供图像曝光调整相关的功能，包括：
 * - GPU加速的自动曝光调整
 * - 手动曝光/对比度/伽马调整
 * - 曝光参数转换为HSL调整层
 */

// 类型导出
export type { ExposureAdjustmentParams, ExposureHistogramData } from './exposureAdjustment'

// 函数导出
export { adjustExposure, adjustExposureManual, exposureToHSLAdjustment } from './exposureAdjustment'

// 资源池类导出（模块内部使用，但允许值导入因为这是模块出口）
export { ResourcePool } from './ResourcePool.class'
