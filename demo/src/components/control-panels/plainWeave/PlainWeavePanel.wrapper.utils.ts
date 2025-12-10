import { createComponentWrapper } from './imports'
import type { VueComponent } from './imports'
import { getSafeIsGenerating, validatePlainWeavePanelProps } from './PlainWeavePanel.guard'
import { default as raw } from './PlainWeavePanel.vue'
import type { PlainWeavePanelProps } from './PlainWeavePanel.types'

/**
 * 创建零绑定 PlainWeavePanel 包装器
 * 自动处理所有 props 和事件绑定，无需在模板中手动绑定
 */
export const createZeroBindingPlainWeavePanel = (parentContext: {
  props: Record<string, unknown>
  emits: Record<string, (...args: unknown[]) => void>
}): VueComponent => {
  return createComponentWrapper(raw, {
    debug: {
      enableLogging: false,
      enablePerformance: false,
      enableTypeChecking: true
    },
    propsInterceptor: {
      // 自动映射父组件的 props 到子组件
      intercept: (): PlainWeavePanelProps => {
        const mappedProps: PlainWeavePanelProps = {
          isGenerating: getSafeIsGenerating(parentContext.props)
        }
        return mappedProps
      },
      validate: (props: PlainWeavePanelProps) => {
        return validatePlainWeavePanelProps(props)
      }
    },
    emitInterceptor: {
      // 自动映射子组件事件到父组件事件处理器
      intercept: (eventName: string, ...args: unknown[]) => {
        const handler = parentContext.emits[eventName]
        if (handler) {
          handler(...args)
          return false // 阻止原始事件，因为我们已经处理了
        }
        return true // 允许原始事件继续
      }
    }
  })
}