import type { Ref } from './imports'

export function useSamplingEditorViewManipulation(
    stageRef: Ref<any>,
    containerRef: Ref<HTMLElement | null>,
    imageObj: Ref<HTMLImageElement | null>,
    groupConfig: Ref<{ x: number, y: number, scaleX: number, scaleY: number }>
) {
    /**
     * 重置视图：图片居中显示，适配屏幕
     * 使用 stage 的 scale 和 position 来实现缩放和平移
     * groupConfig 的 x/y 用于图片在 stage 坐标系内的偏移（此处设为 0，让 stage 来控制整体位置）
     */
    const resetView = (): void => {
        if (!imageObj.value || !containerRef.value) return

        const img = imageObj.value
        const stageW = containerRef.value.clientWidth
        const stageH = containerRef.value.clientHeight

        // 计算适配屏幕的缩放比例
        const scaleX = stageW / img.width
        const scaleY = stageH / img.height
        const scale = Math.min(scaleX, scaleY) * 0.9

        // groupConfig 只需保持默认值，让图片在 group 内从 (0,0) 开始
        groupConfig.value = {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1
        }

        // 使用 stage 来实现居中和缩放
        if (stageRef.value) {
            const stage = stageRef.value.getStage()
            stage.scale({ x: scale, y: scale })
            // 计算居中位置：stage 位置 = (视口中心) - (图片中心 * 缩放)
            stage.position({
                x: (stageW - img.width * scale) / 2,
                y: (stageH - img.height * scale) / 2
            })
            stage.batchDraw()
        }
    }

    /**
     * 滚轮缩放：以鼠标位置为中心缩放
     * 使用 stage 的 scale 和 position
     */
    const handleWheel = (wheelEvent: { evt: WheelEvent }): void => {
        if (!stageRef.value) return

        const evt = wheelEvent.evt
        evt.preventDefault()

        const stage = stageRef.value.getStage()
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const scaleBy = 1.1
        const newScale = evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

        // 计算鼠标在 stage 坐标系中的位置
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale
        }

        // 计算新的 stage 位置，使鼠标指向的点保持不变
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale
        }

        stage.scale({ x: newScale, y: newScale })
        stage.position(newPos)
        stage.batchDraw()
    }

    return {
        resetView,
        handleWheel
    }
}

