/**
 * InputsPanel 类型定义
 */

import type { Ref } from './imports'
import type { useProceduralTextureState } from './imports'
import type { InputsPanelTab } from './InputsPanel.constants'

/**
 * InputsPanel状态
 */
export interface InputsPanelState {
  proceduralState: ReturnType<typeof useProceduralTextureState>['state']
  isGenerating: Ref<boolean>
}

/**
 * InputsPanel行为
 */
export interface InputsPanelActions {
  handleTabChange: (tab: InputsPanelTab) => Promise<void>
  handleTypeChange: (type: string) => void
  handleTextToImageSetImage: (imageData: string) => void
}

/**
 * InputsPanel上下文（包装器）
 */
export interface InputsPanelContext {
  state: InputsPanelState
  actions: InputsPanelActions
}
