/**
 * 水印模块的统一导入文件
 * 按照项目规范，所有来自父级目录的导入都需要通过此文件转发
 */

// Vue 依赖
import { ref, watch, onMounted } from 'vue'
export { ref, watch, onMounted }

// 类型导入
import type { Ref } from 'vue'
export type { Ref }

// 控制事件相关
import { createUpdateDataEvent } from '../../../types/controlEvents'
import type { ControlEvent } from '../../../types/controlEvents'
export { createUpdateDataEvent }
export type { ControlEvent }
