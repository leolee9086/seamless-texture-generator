// 控制组件统一事件类型定义
export type ControlEventType =
  | 'button-click'
  | 'update-data'

export interface ControlEvent {
  type: ControlEventType
  detail: {
    action: string
    data?: any
  }
}

// 按钮点击动作类型
export type ButtonAction =
  | 'load-sample-image'
  | 'process-image'
  | 'toggle-magnifier'
  | 'reset-zoom'
  | 'save-result'
  | 'open-sampling-editor'

// 数据更新动作类型
export type UpdateAction =
  | 'image-upload'
  | 'max-resolution'
  | 'border-size'
  | 'split-position'
  | 'zoom-level'

// 事件创建辅助函数
export const createButtonClickEvent = (action: ButtonAction): ControlEvent => ({
  type: 'button-click',
  detail: { action }
})

export const createUpdateDataEvent = <T = any>(action: UpdateAction, data: T): ControlEvent => ({
  type: 'update-data',
  detail: { action, data }
})