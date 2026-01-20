import { ref, watch } from './imports'
import type { Ref } from './imports'
import type { 水印配置 } from './imports'
import { 默认水印配置 } from './imports'
import { useProjectState } from './project-state/index'

/**
 * 水印状态管理
 * 
 * 与项目状态双向同步：
 * - 切换项目时，从 activeProject.params 加载水印配置
 * - 修改水印时，自动保存到项目参数
 */
export function useWatermarkState(): {
    watermarkConfig: Ref<水印配置>
    enableWatermark: Ref<boolean>
    updateWatermarkConfig: (config: Partial<水印配置>) => void
    toggleWatermark: () => void
    clearWatermark: () => void
} {
    const watermarkConfig: Ref<水印配置> = ref({ ...默认水印配置 })
    const enableWatermark = ref(false)

    // 引入项目状态
    const { state: projectState, actions: projectActions } = useProjectState()

    // 标志位：防止循环同步
    let isSyncing = false

    // === 从项目同步到本地 (Project -> Local) ===
    watch(() => projectState.activeProject.value?.params, (newParams) => {
        if (!newParams || isSyncing) return

        isSyncing = true
        try {
            // 同步水印配置和开关
            enableWatermark.value = newParams.enableWatermark ?? false

            if (newParams.watermarkConfig) {
                watermarkConfig.value = { ...newParams.watermarkConfig }
            }
            // 如果项目没有水印配置，保持当前值或使用默认值
            // 不重置为默认值，以便使用全局配置
        } finally {
            isSyncing = false
        }
    }, { deep: true, immediate: true })

    // === 从本地同步到项目 (Local -> Project) ===
    watch([enableWatermark, watermarkConfig], () => {
        if (!projectState.activeProject.value || isSyncing) return

        isSyncing = true
        try {
            projectActions.updateProjectParams({
                enableWatermark: enableWatermark.value,
                watermarkConfig: watermarkConfig.value
            })
        } finally {
            isSyncing = false
        }
    }, { deep: true, flush: 'sync' })

    /** 更新水印配置 */
    function updateWatermarkConfig(config: Partial<水印配置>): void {
        watermarkConfig.value = { ...watermarkConfig.value, ...config }
        enableWatermark.value = true
    }

    /** 切换水印开关 */
    function toggleWatermark(): void {
        enableWatermark.value = !enableWatermark.value
    }

    /** 清除水印配置 */
    function clearWatermark(): void {
        enableWatermark.value = false
        watermarkConfig.value = { ...默认水印配置 }
    }

    return {
        watermarkConfig,
        enableWatermark,
        updateWatermarkConfig,
        toggleWatermark,
        clearWatermark
    }
}

/** useWatermarkState 返回值类型 */
export type WatermarkState = ReturnType<typeof useWatermarkState>
