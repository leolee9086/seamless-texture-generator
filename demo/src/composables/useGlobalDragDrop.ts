import { ref } from './imports'
import type { UseGlobalDragDropReturn } from './useGlobalDragDrop.types'

/** @简洁函数 检查文件类型是否符合允许的 MIME 类型前缀 */
function 创建文件类型检查器(allowedTypes: string[]): (file: File) => boolean {
    return (file: File): boolean => {
        return allowedTypes.some(type => file.type.startsWith(type.replace('*', '')))
    }
}

/** @简洁函数 从 DataTransfer 过滤出允许的文件 */
function 过滤允许的文件(dataTransfer: DataTransfer, isFileAllowed: (file: File) => boolean): File[] {
    const allowedFiles: File[] = []
    for (let index = 0; index < dataTransfer.files.length; index++) {
        const file = dataTransfer.files[index]
        if (isFileAllowed(file)) {
            allowedFiles.push(file)
        }
    }
    return allowedFiles
}

/**
 * 处理拖放的文件
 * @param files 允许的文件列表
 * @param onDropCallback 单文件回调
 * @param onDropMultiple 多文件回调 (可选)
 */
function 处理拖放文件(
    files: File[],
    onDropCallback: (file: File) => void,
    onDropMultiple?: (files: File[]) => void
): void {
    // 如果提供了多文件回调，使用它
    if (onDropMultiple) {
        onDropMultiple(files)
        return
    }

    // 否则使用单文件回调逐个处理
    for (const file of files) {
        onDropCallback(file)
    }
}

/**
 * 全局拖放 Composable
 *
 * 支持单文件和多文件拖放，向后兼容原有的单文件回调接口。
 *
 * @param onDropCallback 单文件回调 (向后兼容)
 * @param allowedTypes 允许的 MIME 类型前缀 (如 ['image/'])
 * @param onDropMultiple 多文件回调 (可选，新功能)
 */
export function useGlobalDragDrop(
    onDropCallback: (file: File) => void,
    allowedTypes: string[] = ['image/'],
    onDropMultiple?: (files: File[]) => void
): UseGlobalDragDropReturn {
    const isDragging = ref(false)
    const dragCounter = ref(0)
    const isFileAllowed = 创建文件类型检查器(allowedTypes)

    const handleDragEnter = (): void => {
        dragCounter.value++
        // 首次进入时标记拖拽状态
        if (dragCounter.value === 1) {
            isDragging.value = true
        }
    }

    const handleDragLeave = (): void => {
        dragCounter.value--
        // 完全离开时重置拖拽状态
        if (dragCounter.value <= 0) {
            dragCounter.value = 0
            isDragging.value = false
        }
    }

    const handleDrop = (event: DragEvent): void => {
        dragCounter.value = 0
        isDragging.value = false

        const dataTransfer = event.dataTransfer
        if (!dataTransfer?.files.length) return

        const allowedFiles = 过滤允许的文件(dataTransfer, isFileAllowed)
        if (allowedFiles.length === 0) return

        处理拖放文件(allowedFiles, onDropCallback, onDropMultiple)
    }

    return {
        state: { isDragging },
        actions: { handleDragEnter, handleDragLeave, handleDrop }
    }
}
