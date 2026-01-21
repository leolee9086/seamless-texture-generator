import { PipelineData, baseOptions } from '../../types/PipelineData.type'

/**
 * 管线数据格式
 */
export type 管线数据格式 = 'GPUBuffer' | 'ImageData'

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
  /** 节点名称，用于日志输出 */
  名称?: string

  /** 可接受的输入格式（优先级从高到低） */
  可接受输入: 管线数据格式[]

  /** 产出的输出格式 */
  输出格式: 管线数据格式

  /**
   * 检查是否应该执行此中间件
   */
  guard(options: TOptions): boolean

  /**
   * 执行中间件处理（完整流程，包含格式转换）
   */
  process(context: NodeContext<TOptions>): Promise<void>

  /**
   * 纯 CPU 处理函数，供批处理调度器使用
   * 输入和输出都是 ImageData，不包含格式转换
   */
  cpuProcess?: (imageData: ImageData, options: TOptions) => Promise<ImageData>
}

