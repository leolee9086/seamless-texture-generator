// 控制组件统一事件类型定义
export type ControlEventType =
  | 'button-click'
  | 'update-data'

export interface ControlEvent {
  type: ControlEventType
  detail: {
    action: string
    data?: unknown
  }
}

// 按钮点击动作类型
export type ButtonAction =
  | 'load-sample-image'
  | 'process-image'
  | 'toggle-magnifier'
  | 'reset-zoom'
  | 'save-result'
  | 'save-original'
  | 'open-sampling-editor'
  | 'toggle-lut'
  | 'clear-lut'

// 数据更新动作类型
export type UpdateAction =
  | 'image-upload'
  | 'max-resolution'
  | 'border-size'
  | 'split-position'
  | 'zoom-level'
  | 'lut-intensity'
  | 'lut-file-change'
  | 'mask-update'
  | 'set-preview-overlay'
  | 'global-hsl-change'      // 新增
  | 'add-hsl-layer'          // 新增
  | 'update-hsl-layer'       // 新增
  | 'remove-hsl-layer'       // 新增
  | 'exposure-strength'      // 新增
  | 'exposure-manual'        // 新增
  | 'dehaze-change'          // 新增
  | 'clarity-adjustment'      // 新增
  | 'luminance-adjustment'    // 新增
  | 'set-image'               // 新增

// 事件创建辅助函数
export const createButtonClickEvent = (action: ButtonAction): ControlEvent => ({
  type: 'button-click',
  detail: { action }
})

export const createUpdateDataEvent = <T = unknown>(action: UpdateAction, data: T): ControlEvent => ({
  type: 'update-data',
  detail: { action, data }
})