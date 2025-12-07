import { PipelineData } from '../../types/PipelineData.type'



/**
 * 中间件处理函数类型
 */
export type MiddlewareProcessor = (pipelineData: PipelineData, device: GPUDevice) => Promise<PipelineData>