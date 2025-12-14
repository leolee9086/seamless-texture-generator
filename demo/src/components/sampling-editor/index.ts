/**
 * SamplingEditor 采样区域编辑器模块
 * 用于图片透视裁切，支持自由比例和固定比例
 */

// 主组件
import SamplingEditor from './SamplingEditor.vue'

// 类型导出
import type { SamplingEditorProps, SamplingEditorEmit } from './SamplingEditor.types'

// 逻辑 composable 导出
import { useSamplingEditorLogic } from './SamplingEditor.ctx'

export { SamplingEditor }
export type { SamplingEditorProps, SamplingEditorEmit }
export { useSamplingEditorLogic }

