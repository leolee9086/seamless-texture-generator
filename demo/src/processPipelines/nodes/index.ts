export type { Node as Middleware, NodeContext as MiddlewareContext } from './types'
export type { MiddlewareProcessor } from './utils'
import { exposureMiddleware } from './exposureNode'
import { clarityMiddleware } from './clarityNode'
import { luminanceMiddleware } from './luminanceNode'
import { dehazeMiddleware } from './dehazeNode'

/**
 * 所有可用的中间件列表
 */
export const allMiddlewares = [
  exposureMiddleware,
  dehazeMiddleware,
  clarityMiddleware,
  luminanceMiddleware
] as const
