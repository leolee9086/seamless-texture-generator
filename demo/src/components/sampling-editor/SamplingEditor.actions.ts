import { Ref, warpPerspective, getDistance } from './imports'
//@AIDONE 采样区域编辑组件(裁切组件)已整理到 sampling-editor 文件夹
export function useSamplingEditorActions(
    imageObj: Ref<HTMLImageElement | null>,
    points: Ref<{ x: number, y: number }[]>,
    emit: (event: 'confirm' | 'close', ...args: any[]) => void,
    isProcessing: Ref<boolean>
) {
    const confirm = async () => {
        if (!imageObj.value) return
        isProcessing.value = true

        // Allow UI to update
        setTimeout(() => {
            try {
                const img = imageObj.value!

                const p = points.value
                const topWidth = getDistance(p[0], p[1])
                const bottomWidth = getDistance(p[3], p[2])
                const leftHeight = getDistance(p[0], p[3])
                const rightHeight = getDistance(p[1], p[2])

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

                // Put back to canvas to get data URL
                const outCanvas = document.createElement('canvas')
                outCanvas.width = width
                outCanvas.height = height
                const outCtx = outCanvas.getContext('2d')!
                outCtx.putImageData(dstImageData, 0, 0)

                emit('confirm', outCanvas.toDataURL())
                emit('close')
            } catch (e) {
                console.error(e)
                alert('Error processing image')
            } finally {
                isProcessing.value = false
            }
        }, 10)
    }

    const cancel = () => {
        emit('close')
    }

    return {
        confirm,
        cancel
    }
}
