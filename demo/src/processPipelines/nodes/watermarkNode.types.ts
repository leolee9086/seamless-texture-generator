/**
 * 水印节点类型定义
 */
import type { baseOptions } from './imports'
import type { 水印配置 } from './imports'

/** 包含水印配置的选项类型 */
export interface WatermarkOptions extends baseOptions {
    watermarkConfig?: 水印配置
    enableWatermark?: boolean
}

/** GPU Buffer 转 Canvas 的上下文 */
export interface BufferToCanvasContext {
    buffer: GPUBuffer | GPUTexture
    width: number
    height: number
    device: GPUDevice
}

/** Canvas 转 GPUBuffer 的上下文 */
export interface CanvasToBufferContext {
    canvas: HTMLCanvasElement
    device: GPUDevice
}
