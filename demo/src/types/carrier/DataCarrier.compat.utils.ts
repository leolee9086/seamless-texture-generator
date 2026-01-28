/**
 * DataCarrier 类型体系 - 兼容性适配器
 * 
 * 提供与现有 PipelineData 类型的双向转换功能：
 * - fromPipelineData: 从旧版 PipelineData 转换为 DataCarrier
 * - toPipelineData: 从 DataCarrier 转换为旧版 PipelineData
 * - fromPipelineDataMultiRecord: 批量转换多记录类型
 * - toPipelineDataMultiRecord: 批量转换为多记录类型
 * 
 * 支持渐进式迁移，确保新旧代码可以共存
 */

import type { PipelineData, PipelineDataMultiRecord } from './imports'
import type {
  GPUBufferCarrier,
  GPUTextureCarrier,
  PipelineCarrier,
  PipelineCarrierMultiRecord
} from './DataCarrier.types'
import { createGPUBufferCarrier, createGPUTextureCarrier } from './DataCarrier.factories.utils'
import { isGPUBufferCarrier, isGPUTextureCarrier, isGPUTexture } from './DataCarrier.guard'

// ============================================================================
// 单记录转换函数
// ============================================================================

/**
 * 从旧版 PipelineData 转换为 DataCarrier
 * 通过检测 buffer 类型来确定具体的 Carrier 类型
 */
export function fromPipelineData(data: PipelineData): GPUBufferCarrier | GPUTextureCarrier {
  const buffer = data.buffer
  
  // 使用类型守卫检测是否为 GPUTexture
  if (isGPUTexture(buffer)) {
    return createGPUTextureCarrier({
      texture: buffer,
      width: data.width,
      height: data.height
    })
  }
  
  // 否则为 GPUBuffer（类型守卫已收窄类型）
  return createGPUBufferCarrier({
    buffer,
    width: data.width,
    height: data.height
  })
}

/**
 * 从 DataCarrier 转换为旧版 PipelineData
 * 仅支持 GPUBufferCarrier 和 GPUTextureCarrier
 */
export function toPipelineData(carrier: PipelineCarrier): PipelineData {
  if (isGPUBufferCarrier(carrier)) {
    return {
      buffer: carrier.state.buffer,
      width: carrier.state.width,
      height: carrier.state.height
    }
  }
  
  if (isGPUTextureCarrier(carrier)) {
    return {
      buffer: carrier.state.texture,
      width: carrier.state.width,
      height: carrier.state.height
    }
  }
  
  // TypeScript 会确保这里不会到达，但为了运行时安全添加错误处理
  throw new TypeError('Unsupported carrier format')
}

// ============================================================================
// 多记录转换函数
// ============================================================================

/**
 * 从旧版 PipelineDataMultiRecord 批量转换为 DataCarrier 记录
 * 遍历所有键值对，逐个转换为对应的 Carrier 类型
 */
export function fromPipelineDataMultiRecord(
  record: PipelineDataMultiRecord
): Record<string, GPUBufferCarrier | GPUTextureCarrier> {
  const result: Record<string, GPUBufferCarrier | GPUTextureCarrier> = {}
  
  for (const key of Object.keys(record)) {
    result[key] = fromPipelineData(record[key])
  }
  
  return result
}

/**
 * 从 DataCarrier 记录批量转换为旧版 PipelineDataMultiRecord
 * 遍历所有键值对，逐个转换为 PipelineData 类型
 */
export function toPipelineDataMultiRecord(
  record: PipelineCarrierMultiRecord
): PipelineDataMultiRecord {
  const result: PipelineDataMultiRecord = {}
  
  for (const key of Object.keys(record)) {
    result[key] = toPipelineData(record[key])
  }
  
  return result
}
