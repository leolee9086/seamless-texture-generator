import { ref, watch } from 'vue'
import { useProjectState } from './project-state/index'
import { lutDb } from '../utils/lutDb'

/**
 * LUT（颜色查找表）控制
 * 
 * 与项目状态双向同步：
 * - 切换项目时，从 activeProject.params 加载 LUT
 * - 修改 LUT 时，自动保存到项目参数
 */
export function useLUTControl() {
    const lutEnabled = ref(false)
    const lutIntensity = ref(1.0)
    const lutFileName = ref<string | null>(null)
    const lutFile = ref<File | null>(null)
    /** 当前选中的 LUT ID (用于持久化) */
    const lutId = ref<string | null>(null)

    // 引入项目状态
    const { state: projectState, actions: projectActions } = useProjectState()

    // 标志位：防止循环同步
    let isSyncing = false

    // === 从项目同步到本地 (Project -> Local) ===
    watch(() => projectState.activeProject.value?.params, async (newParams) => {
        if (!newParams || isSyncing) return

        isSyncing = true
        try {
            // 同步 LUT ID 和强度
            lutId.value = newParams.lutId ?? null
            lutIntensity.value = newParams.lutIntensity ?? 1.0
            lutEnabled.value = newParams.lutId !== null

            // 根据 lutId 从 lutDb 加载 LUT 文件
            if (newParams.lutId) {
                const luts = await lutDb.getAllLUTs()
                const lutItem = luts.find(l => l.id === newParams.lutId)
                if (lutItem) {
                    lutFileName.value = lutItem.name
                    lutFile.value = new File([lutItem.file], lutItem.name, { type: 'text/plain' })
                } else {
                    // LUT 已被删除，清除引用
                    lutFileName.value = null
                    lutFile.value = null
                }
            } else {
                lutFileName.value = null
                lutFile.value = null
            }
        } finally {
            isSyncing = false
        }
    }, { deep: true, immediate: true })

    // === 从本地同步到项目 (Local -> Project) ===
    watch([lutId, lutIntensity], () => {
        if (!projectState.activeProject.value || isSyncing) return

        isSyncing = true
        try {
            projectActions.updateProjectParams({
                lutId: lutId.value,
                lutIntensity: lutIntensity.value
            })
        } finally {
            isSyncing = false
        }
    }, { flush: 'sync' })

    /** 切换 LUT 开关 */
    const toggleLUT = () => {
        lutEnabled.value = !lutEnabled.value
        if (!lutEnabled.value) {
            // 关闭时清除 LUT
            lutId.value = null
            lutFileName.value = null
            lutFile.value = null
        }
    }

    /** 清除 LUT */
    const clearLUT = () => {
        lutId.value = null
        lutFileName.value = null
        lutFile.value = null
        lutEnabled.value = false
    }

    /** 设置 LUT 文件 (通过 LUT ID) */
    const setLUTById = (id: string, file: File) => {
        lutId.value = id
        lutFile.value = file
        lutFileName.value = file.name
        lutEnabled.value = true
    }

    /** 设置 LUT 文件 (保持向后兼容) */
    const setLUTFile = async (file: File) => {
        // 尝试从 lutDb 中查找匹配的 LUT
        const luts = await lutDb.getAllLUTs()
        const matchingLut = luts.find(l => l.name === file.name)
        if (matchingLut) {
            setLUTById(matchingLut.id, file)
        } else {
            // 如果没找到，只设置文件但不持久化 ID
            lutFile.value = file
            lutFileName.value = file.name
            lutEnabled.value = true
        }
    }

    /** 设置 LUT 强度 */
    const setLUTIntensity = (value: number) => {
        lutIntensity.value = value
    }

    return {
        lutEnabled,
        lutIntensity,
        lutFileName,
        lutFile,
        lutId,
        toggleLUT,
        clearLUT,
        setLUTFile,
        setLUTById,
        setLUTIntensity,
    }
}

/** useLUTControl 返回值类型 */
export type LUTControl = ReturnType<typeof useLUTControl>

