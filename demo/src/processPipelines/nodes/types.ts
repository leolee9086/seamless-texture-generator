import { PipelineData, baseOptions } from '../../types/PipelineData.type'

/**
 * 中间件上下文接口
 */
export interface NodeContext<TOptions extends baseOptions = baseOptions> {
  options: TOptions
  pipelineData: PipelineData
  cache: WeakMap<any, any>
  getWebGPUDevice: () => Promise<GPUDevice>
}

/**
 * 中间件接口
 */
export interface Node<TOptions extends baseOptions = baseOptions> {
  /**
   * 检查是否应该执行此中间件
   */
  guard(options: TOptions): boolean
  /**
   * 执行中间件处理
   */
  process(context: NodeContext<TOptions>): Promise<void>
}

