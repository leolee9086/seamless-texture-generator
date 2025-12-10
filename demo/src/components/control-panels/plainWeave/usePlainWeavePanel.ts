import { watch, useProceduralTextureState } from './imports'
import { handleWeaveParamUpdate, applyPreset, createPlainWeaveGenerator } from './PlainWeavePanel.utils'
import type { WeavePreset, UsePlainWeavePanelReturn } from './PlainWeavePanel.types'

/**
 * 平纹织物面板组合式函数
 * 提取平纹织物面板的业务逻辑，使组件只负责展示
 */
export const usePlainWeavePanel = (
  emit: (event: 'set-image', data: string) => void,
  weavePresets: Record<string, WeavePreset>
): UsePlainWeavePanelReturn => {
  // 使用持久化状态管理
  const { state } = useProceduralTextureState()

  // 创建防抖生成器
  const { generate, debouncedGenerate, localIsGenerating } = createPlainWeaveGenerator(
    { plainWeaveParams: state.plainWeaveParams },
    emit
  )

  // 处理参数更新
  const handleParamUpdate = (data: { id: string; value: number }): void => {
    handleWeaveParamUpdate({ plainWeaveParams: state.plainWeaveParams }, data)
  }

  // 应用预设
  const handleApplyPreset = (preset: WeavePreset): void => {
    applyPreset({ plainWeaveParams: state.plainWeaveParams }, preset)
  }

  // 监听参数变化，触发防抖生成
  watch(state.plainWeaveParams, () => {
    debouncedGenerate()
  }, { deep: true })

  return {
    // 状态
    state: { plainWeaveParams: state.plainWeaveParams },
    localIsGenerating,
    
    // 配置
    weavePresets,
    
    // 方法
    handleParamUpdate,
    handleApplyPreset,
    generate
  }
}