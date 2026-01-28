/**
 * DataCarrier 模块导入转发
 * 
 * 转发父目录和第三方包的导入，避免直接从父目录导入
 */

// 转发父目录的 PipelineData 类型
import type { PipelineData, PipelineDataMultiRecord } from '../PipelineData.type'

export type { PipelineData, PipelineDataMultiRecord }