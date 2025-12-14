import { watch, useProceduralTextureState } from './imports'
import { handleWeaveParamUpdate, applyPreset, createPlainWeaveGenerator } from './PlainWeaveAdvancedPanel.utils'
import type { WeavePreset, UsePlainWeavePanelReturn } from './PlainWeaveAdvancedPanel.types'

/**
 * 平纹织物面板组合式函数 (Advanced)
 * 提取平纹织物面板的业务逻辑，使组件只负责展示
 */
export const usePlainWeaveAdvancedPanel = (
  emit: (event: 'set-image', data: string) => void,
  weavePresets: Record<string, WeavePreset>
): UsePlainWeavePanelReturn => {
  // 使用持久化状态管理
  const { state } = useProceduralTextureState()

  // 创建防抖生成器
  const {
    state: { localIsGenerating },
    actions: { generate, debouncedGenerate }
  } = createPlainWeaveGenerator(
    state.plainWeaveAdvancedParams,
    emit
  )

  // 处理参数更新
  /** @简洁函数 Wrapper for param update logic */
  const handleParamUpdate = (data: { id: string; value: number }): void => {
    handleWeaveParamUpdate(state.plainWeaveAdvancedParams, data)
  }

  // 应用预设
  /** @简洁函数 Wrapper for preset application logic */
  const handleApplyPreset = (preset: WeavePreset): void => {
    applyPreset(state.plainWeaveAdvancedParams, preset)
  }

  // 监听参数变化，触发防抖生成
  watch(state.plainWeaveAdvancedParams, () => {
    debouncedGenerate()
  }, { deep: true })

  return {
    state: {
      plainWeaveParams: state.plainWeaveAdvancedParams,
      localIsGenerating,
      weavePresets
    },
    actions: {
      handleParamUpdate,
      handleApplyPreset,
      generate,
      debouncedGenerate
    }
  }
}