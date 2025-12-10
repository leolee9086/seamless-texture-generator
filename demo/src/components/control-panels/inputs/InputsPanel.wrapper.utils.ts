import { createComponentWrapper } from './imports'
import type { VueComponent} from './imports'
import { INPUTS_PANEL_VALIDATION_ERRORS, INPUTS_PANEL_TYPES } from './InputsPanel.constants'
import {
  getSafeIsMobile,
  getSafeIsProcessing,
  getSafeOriginalImage,
  getSafeInputSliderItems
} from './InputsPanel.guard'
import { default as raw } from './InputsPanel.vue'
import type { InputsPanelProps } from './InputsPanel.types'
/**
 * 创建零绑定 InputsPanel 包装器
 * 自动处理所有 props 和事件绑定，无需在模板中手动绑定
 */
export const createZeroBindingInputsPanel = (parentContext: {
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
      intercept: (): InputsPanelProps => {
        const mappedProps: InputsPanelProps = {
          isMobile: getSafeIsMobile(parentContext.props),
          isProcessing: getSafeIsProcessing(parentContext.props),
          originalImage: getSafeOriginalImage(parentContext.props),
          inputSliderItems: getSafeInputSliderItems(parentContext.props)
        }
        return mappedProps
      },
      validate: (props: InputsPanelProps) => {
        if (typeof props.isProcessing !== INPUTS_PANEL_TYPES.BOOLEAN) {
          return INPUTS_PANEL_VALIDATION_ERRORS.IS_PROCESSING_BOOLEAN
        }
        if (props.originalImage !== null && typeof props.originalImage !== INPUTS_PANEL_TYPES.STRING) {
          return INPUTS_PANEL_VALIDATION_ERRORS.ORIGINAL_IMAGE_STRING_OR_NULL
        }
        if (!Array.isArray(props.inputSliderItems)) {
          return INPUTS_PANEL_VALIDATION_ERRORS.INPUT_SLIDER_ITEMS_ARRAY
        }
        return true
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