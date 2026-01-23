/**
 * InputsPanel 上下文逻辑
 *
 * 处理InputsPanel的状态管理和事件处理
 */

import { ref } from './imports'
import { useProceduralTextureState, useCanvasModeManager } from './imports'
import { 处理标签切换 } from './InputsPanel.utils'
import type { InputsPanelTab } from './InputsPanel.constants'
import type { InputsPanelContext } from './InputsPanel.types'

/**
 * 创建InputsPanel上下文
 *
 * @param emit - Vue emit函数
 * @returns InputsPanel上下文
 */
export function createInputsPanelContext(
  emit: (event: 'set-image', imageData: string) => void
): InputsPanelContext {
  const { state: proceduralState } = useProceduralTextureState()
  const canvasModeManager = useCanvasModeManager()
  const isGenerating = ref(false)

  /** @简洁函数 更新活动标签的回调 */
  const updateActiveTab = (tab: InputsPanelTab): void => {
    proceduralState.activeTab = tab
  }

  /** @简洁函数 处理标签切换，委托给工具函数 */
  const handleTabChange = async (tab: InputsPanelTab): Promise<void> => {
    await 处理标签切换(tab, canvasModeManager, updateActiveTab)
  }

  /** @简洁函数 更新程序化纹理类型 */
  const handleTypeChange = (type: string): void => {
    proceduralState.proceduralType = type
  }

  /** @简洁函数 处理文本生成图像的set-image事件，转发给父组件 */
  const handleTextToImageSetImage = (imageData: string): void => {
    emit('set-image', imageData)
  }

  return {
    state: {
      proceduralState,
      isGenerating
    },
    actions: {
      handleTabChange,
      handleTypeChange,
      handleTextToImageSetImage
    }
  }
}
