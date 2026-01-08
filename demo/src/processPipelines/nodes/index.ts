export type { Node as Middleware, NodeContext as MiddlewareContext } from './types'
export type { MiddlewareProcessor } from './utils'
import { exposureMiddleware } from './exposureNode'
import { clarityMiddleware } from './clarityNode'
import { luminanceMiddleware } from './luminanceNode'
import { dehazeMiddleware } from './dehazeNode'
import { watermarkMiddleware } from './watermarkNode'

/**
 * 所有可用的中间件列表
 * 水印节点放在最后，因为它应该在所有其他处理完成后应用
 */
export const allMiddlewares = [
  exposureMiddleware,
  dehazeMiddleware,
  clarityMiddleware,
  luminanceMiddleware,
  watermarkMiddleware
] as const

