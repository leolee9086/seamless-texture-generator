import type { Ref } from './imports'

export interface DragDropActions {
    handleDragEnter: () => void
    handleDragLeave: () => void
    handleDrop: (event: DragEvent) => void
}

export interface UseGlobalDragDropReturn {
    state: {
        isDragging: Ref<boolean>
    }
    actions: DragDropActions
}
