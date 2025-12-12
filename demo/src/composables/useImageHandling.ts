import { type Ref } from 'vue'
import { handleImageUpload as uploadHandler, resetZoom as resetZoomFunc, saveImage } from '../utils/imageHandlers'
import { watchImageChanges } from '../utils/imageWatcher'
import { saveOriginalImage, saveProcessedImage } from '../utils/download'

/** useImageHandling 选项 */
export interface UseImageHandlingOptions {
    rawOriginalImage: Ref<string | null>
    originalImage: Ref<string | null>
    processedImage: Ref<string | null>
    maxResolution: Ref<number>
    errorMessage: Ref<string>
    viewerRef: Ref<unknown>
    zoomLevel: Ref<number>
    isSampling: Ref<boolean>
}

/**
 * 图像处理相关功能
 */
export function useImageHandling(options: UseImageHandlingOptions) {
    const { rawOriginalImage, originalImage, processedImage, maxResolution, errorMessage, viewerRef, zoomLevel, isSampling } = options

    // 监听原始图像和最大分辨率的变化
    watchImageChanges(rawOriginalImage, maxResolution, originalImage, (msg) => {
        errorMessage.value = msg
    })

    /** 处理图像上传 */
    const handleImageUploadWrapper = (event: Event) => {
        uploadHandler(event, (imageData: string) => {
            rawOriginalImage.value = imageData
            processedImage.value = null
            errorMessage.value = ''
        })
    }

    /** 加载示例图像 */
    const loadSampleImageWrapper = (): void => {
        rawOriginalImage.value = 'https://picsum.photos/seed/texture/512/512.jpg'
        processedImage.value = null
        errorMessage.value = ''
    }

    /** 处理采样确认 */
    const handleSamplingConfirmWrapper = (imageData: string): void => {
        originalImage.value = imageData
        processedImage.value = null
    }

    /** 重置缩放 */
    const resetZoomWrapper = () => {
        resetZoomFunc(() => {
            zoomLevel.value = 1
        }, viewerRef)
    }

    /** 保存处理结果 */
    const saveResultWrapper = (): void => {
        saveImage(processedImage.value, saveProcessedImage)
    }

    /** 保存原始图像 */
    const saveOriginalWrapper = (): void => {
        saveImage(originalImage.value, saveOriginalImage)
    }

    /** 打开采样编辑器 */
    const openSamplingEditor = () => {
        isSampling.value = true
    }

    /** 设置图像数据 */
    const setImage = (imageData: string) => {
        rawOriginalImage.value = imageData
        processedImage.value = null
        errorMessage.value = ''
    }

    return {
        handleImageUploadWrapper,
        loadSampleImageWrapper,
        handleSamplingConfirmWrapper,
        resetZoomWrapper,
        saveResultWrapper,
        saveOriginalWrapper,
        openSamplingEditor,
        setImage,
    }
}

/** useImageHandling 返回值类型 */
export type ImageHandling = ReturnType<typeof useImageHandling>
