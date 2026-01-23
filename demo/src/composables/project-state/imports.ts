/**
 * 项目状态模块导入转发
 */

// Vue
import { ref, shallowRef, computed, toRaw } from 'vue'
import type { Ref, ShallowRef, ComputedRef } from 'vue'

// 项目类型
import type { ImageProject, ProjectParams } from '../../types/project.types'

// 基础设施
import { projectFS } from '../../infra/ProjectFileSystem'

// 调整参数预设
import { 默认去雾参数, 默认清晰度参数, 默认亮度参数 } from '../useAdjustmentParams.presets'
import { DEFAULT_CLAHE_CONFIG } from '../../adjustments/exposure/exposureAdjustment.types'

// 画布模式管理
import { useCanvasModeManager } from '../canvas-mode/index'
import { CANVAS_MODE_IDS } from '../canvas-mode/constants'

export {
    ref,
    shallowRef,
    computed,
    toRaw,
    projectFS,
    默认去雾参数,
    默认清晰度参数,
    默认亮度参数,
    DEFAULT_CLAHE_CONFIG,
    useCanvasModeManager,
    CANVAS_MODE_IDS
}

export type {
    Ref,
    ShallowRef,
    ComputedRef,
    ImageProject,
    ProjectParams
}
