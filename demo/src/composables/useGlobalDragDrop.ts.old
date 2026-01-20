import { ref } from './imports'
import type { UseGlobalDragDropReturn } from './useGlobalDragDrop.types'

/**
 * Global Drag and Drop Composable
 * @param onDropCallback Callback function when a file is dropped
 * @param allowedTypes Array of allowed MIME types (e.g. ['image/'])
 */
export function useGlobalDragDrop(onDropCallback: (file: File) => void, allowedTypes: string[] = ['image/']): UseGlobalDragDropReturn {
    const isDragging = ref(false)
    const dragCounter = ref(0)

    const handleDragEnter = (): void => {
        dragCounter.value++
        if (dragCounter.value === 1) {
            isDragging.value = true
        }
    }

    const handleDragLeave = (): void => {
        dragCounter.value--
        if (dragCounter.value <= 0) {
            dragCounter.value = 0
            isDragging.value = false
        }
    }

    const handleDrop = (event: DragEvent): void => {
        dragCounter.value = 0
        isDragging.value = false

        const file = event.dataTransfer?.files[0]
        if (!file) return

        const isAllowed = allowedTypes.some(type => file.type.startsWith(type.replace('*', '')))

        if (isAllowed) {
            onDropCallback(file)
        }
    }

    return {
        state: {
            isDragging
        },
        actions: {
            handleDragEnter,
            handleDragLeave,
            handleDrop
        }
    }
}
