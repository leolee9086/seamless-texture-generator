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

export {
    ref,
    shallowRef,
    computed,
    toRaw,
    projectFS,
    默认去雾参数,
    默认清晰度参数,
    默认亮度参数
}

export type {
    Ref,
    ShallowRef,
    ComputedRef,
    ImageProject,
    ProjectParams
}
