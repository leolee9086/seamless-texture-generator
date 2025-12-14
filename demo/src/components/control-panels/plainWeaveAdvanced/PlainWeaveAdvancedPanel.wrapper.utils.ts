import { createComponentWrapper } from './imports'
import type { VueComponent } from './imports'
import { getSafeIsGenerating, validatePlainWeavePanelProps, validateImageData } from './PlainWeaveAdvancedPanel.guard'
import { PLAIN_WEAVE_PANEL_EVENTS, PLAIN_WEAVE_PANEL_VALIDATION_ERRORS, PLAIN_WEAVE_PANEL_ERROR_TEMPLATES } from './PlainWeaveAdvancedPanel.constants'
import { default as raw } from './PlainWeaveAdvancedPanel.vue'
import type { PlainWeavePanelProps } from './PlainWeaveAdvancedPanel.types'

/**
 * 处理 set-image 事件
 */
const handleSetImageEvent = (handler: (...args: unknown[]) => void, args: unknown[]): boolean => {
  // 卫语句：检查参数数量
  if (args.length === 0) {
    console.warn(PLAIN_WEAVE_PANEL_VALIDATION_ERRORS.NO_IMAGE_DATA)
    return true // 没有参数，允许原始事件继续
  }

  const imageData = args[0]
  const validation = validateImageData(imageData)
  // 卫语句：检查数据有效性
  if (validation !== true) {
    const errorMessage = PLAIN_WEAVE_PANEL_ERROR_TEMPLATES.INVALID_IMAGE_DATA_WITH_REASON(validation)
    console.warn(errorMessage)
    return true // 数据无效，允许原始事件继续
  }

  handler(imageData)
  return false // 阻止原始事件，因为我们已经处理了
}

/**
 * 创建零绑定 PlainWeaveAdvancedPanel 包装器
 * 自动处理所有 props 和事件绑定，无需在模板中手动绑定
 */
export const createZeroBindingPlainWeaveAdvancedPanel = (parentContext: {
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
        if (!handler) {
          return true // 允许原始事件继续
        }

        // 对于 'set-image' 事件，验证并处理图片数据
        if (eventName === PLAIN_WEAVE_PANEL_EVENTS.SET_IMAGE) {
          return handleSetImageEvent(handler, args)
        }

        // 对于其他事件，直接传递参数
        handler(...args)
        return false // 阻止原始事件，因为我们已经处理了
      }
    }
  })
}