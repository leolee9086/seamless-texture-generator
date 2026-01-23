/**
 * InputsPanel 逻辑工具函数
 * 
 * 处理标签切换和画布模式管理
 */

import type { InputsPanelTab } from './InputsPanel.constants'
import { INPUTS_PANEL_TABS } from './InputsPanel.constants'
import { CANVAS_MODE_IDS } from './imports'
import type { useCanvasModeManager } from './imports'

/**
 * 根据标签确定应该使用的画布模式
 */
function 确定画布模式(tab: InputsPanelTab): string {
  // 卫语句：如果是程序化纹理标签，返回程序化模式
  if (tab === INPUTS_PANEL_TABS.PROCEDURAL) {
    return CANVAS_MODE_IDS.PROCEDURAL
  }
  
  // 其他标签使用项目模式
  return CANVAS_MODE_IDS.PROJECT
}

/**
 * 处理标签切换，自动切换画布模式
 * 
 * @param tab - 新的标签
 * @param canvasModeManager - 画布模式管理器
 * @param updateActiveTab - 更新活动标签的回调
 */
export async function 处理标签切换(
  tab: InputsPanelTab,
  canvasModeManager: ReturnType<typeof useCanvasModeManager>,
  updateActiveTab: (tab: InputsPanelTab) => void
): Promise<void> {
  // 更新活动标签
  updateActiveTab(tab)
  
  // 确定目标画布模式
  const targetMode = 确定画布模式(tab)
  
  // 卫语句：如果已经是目标模式，无需切换
  if (canvasModeManager.activeModeId.value === targetMode) {
    return
  }
  
  // 切换到目标画布模式
  await canvasModeManager.switchMode(targetMode)
}
