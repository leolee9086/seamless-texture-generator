import { PipelineData, baseOptions } from '../../types/PipelineData.type'

/**
 * 中间件上下文接口
 */
export interface MiddlewareContext<TOptions extends baseOptions = baseOptions> {
  options: TOptions
  pipelineData: PipelineData
  cache: WeakMap<any, any>
}

/**
 * 中间件接口
 */
export interface Middleware<TOptions extends baseOptions = baseOptions> {
  /**
   * 检查是否应该执行此中间件
   */
  guard(options: TOptions): boolean
  
  /**
   * 执行中间件处理
   */
  process(context: MiddlewareContext<TOptions>): Promise<void>
}

