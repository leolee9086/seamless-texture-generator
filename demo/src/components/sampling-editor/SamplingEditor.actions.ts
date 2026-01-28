import { warpPerspective, getDistance } from './imports'
import { IMAGE_MIME_TYPE_PNG, ERROR_CANVAS_TO_BLOB_FAILED } from './SamplingEditor.constants'
import type { SamplingEditorActionsContext, SamplingEditorActionsReturn } from './SamplingEditor.types'
//@AIDONE 采样区域编辑组件(裁切组件)已整理到 sampling-editor 文件夹

/**
 * 将 Canvas 转换为 Blob URL
 * 使用 toBlob 替代 toDataURL 以提高性能
 */
function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error(ERROR_CANVAS_TO_BLOB_FAILED))
                return
            }
            resolve(URL.createObjectURL(blob))
        }, IMAGE_MIME_TYPE_PNG)
    })
}

/**
 * 采样编辑器 Actions
 * 提供确认和取消操作
 */
export function useSamplingEditorActions(
    ctx: SamplingEditorActionsContext
): SamplingEditorActionsReturn {
    const { imageObj, points, emit, isProcessing } = ctx

    const confirm = async (): Promise<void> => {
        if (!imageObj.value) return
        isProcessing.value = true

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10))

        try {
            const img = imageObj.value!

            const cornerPoints = points.value
            const topWidth = getDistance(cornerPoints[0], cornerPoints[1])
            const bottomWidth = getDistance(cornerPoints[3], cornerPoints[2])
            const leftHeight = getDistance(cornerPoints[0], cornerPoints[3])
            const rightHeight = getDistance(cornerPoints[1], cornerPoints[2])

            const width = Math.round((topWidth + bottomWidth) / 2)
            const height = Math.round((leftHeight + rightHeight) / 2)

            // Create a temporary canvas to get ImageData
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = img.width
            tempCanvas.height = img.height
            const tempCtx = tempCanvas.getContext('2d')!
            tempCtx.drawImage(img, 0, 0)
            const srcImageData = tempCtx.getImageData(0, 0, img.width, img.height)

            // Warp
            const dstImageData = warpPerspective(srcImageData, points.value, width, height)

            // Put back to canvas and convert to Blob URL
            const outCanvas = document.createElement('canvas')
            outCanvas.width = width
            outCanvas.height = height
            const outCtx = outCanvas.getContext('2d')!
            outCtx.putImageData(dstImageData, 0, 0)

            const blobUrl = await canvasToBlobUrl(outCanvas)
            emit('confirm', blobUrl)
            emit('close')
        } catch (error) {
            console.error(error)
            alert('Error processing image')
        } finally {
            isProcessing.value = false
        }
    }

    /** @简洁函数 取消操作的委托函数，用于统一返回接口 */
    const cancel = (): void => {
        emit('close')
    }

    return {
        confirm,
        cancel
    }
}
