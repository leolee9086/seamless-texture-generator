import { ref } from 'vue'

/**
 * LUT（颜色查找表）控制
 */
export function useLUTControl() {
    const lutEnabled = ref(false)
    const lutIntensity = ref(1.0)
    const lutFileName = ref<string | null>(null)
    const lutFile = ref<File | null>(null)

    /** 切换 LUT 开关 */
    const toggleLUT = () => {
        lutEnabled.value = !lutEnabled.value
    }

    /** 清除 LUT */
    const clearLUT = () => {
        lutFileName.value = null
        lutFile.value = null
    }

    /** 设置 LUT 文件 */
    const setLUTFile = (file: File) => {
        lutFile.value = file
        lutFileName.value = file.name
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
        toggleLUT,
        clearLUT,
        setLUTFile,
        setLUTIntensity,
    }
}

/** useLUTControl 返回值类型 */
export type LUTControl = ReturnType<typeof useLUTControl>
