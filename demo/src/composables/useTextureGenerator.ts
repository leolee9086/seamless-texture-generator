import { ref, onMounted, type Ref } from 'vue'
import { processImageToTileable } from '../utils/imageProcessor'
import {
  handleImageUpload as uploadHandler,
  loadSampleImage as loadSample,
  handleSamplingConfirm as samplingConfirm,
  toggleMagnifier as toggleMag,
  resetZoom as resetZoomFunc,
  saveOriginal as saveOrig,
  saveResult as saveRes
} from '../utils/imageHandlers'
import { isMobileDevice, supportsNativeCamera as checkNativeCameraSupport } from '../utils/deviceDetection'
import { watchImageChanges } from '../utils/imageWatcher'
import { handlePhotoCaptured, handleCameraError, toggleCamera } from '../utils/cameraHandlers'
import { saveOriginalImage, saveProcessedImage } from '../utils/download'
import { createControlEventHandler } from '../utils/controlEventHandler'
import type { ControlEvent } from '../types/controlEvents'

export interface UseTextureGeneratorOptions {
  /** 是否启用摄像头功能（仅桌面端） */
  enableCamera?: boolean
  /** 初始最大分辨率 */
  initialMaxResolution?: number
  /** 初始边框大小 */
  initialBorderSize?: number
}

export interface UseTextureGeneratorReturn {
  // 状态
  originalImage: Ref<string | null>
  rawOriginalImage: Ref<string | null>
  processedImage: Ref<string | null>
  borderSize: Ref<number>
  maxResolution: Ref<number>
  splitPosition: Ref<number>
  isProcessing: Ref<boolean>
  isSampling: Ref<boolean>
  errorMessage: Ref<string>
  viewerRef: Ref<any>
  zoomLevel: Ref<number>
  magnifierEnabled: Ref<boolean>
  isMobile: Ref<boolean>
  cameraActive: Ref<boolean>
  supportsNativeCamera: Ref<boolean>
  lutEnabled: Ref<boolean>
  lutIntensity: Ref<number>
  lutFileName: Ref<string | null>
  lutFile: Ref<File | null>
  maskGenerator: Ref<(() => Promise<Uint8Array | null>) | null>

  // 方法
  handleImageUploadWrapper: (event: Event) => void
  loadSampleImageWrapper: () => void
  toggleCameraWrapper: () => void
  handlePhotoCapturedWrapper: (imageData: string) => void
  handleCameraErrorWrapper: (message: string) => void
  handleSamplingConfirmWrapper: (imageData: string) => void
  processImage: () => Promise<void>
  toggleMagnifierWrapper: () => void
  resetZoomWrapper: () => void
  saveResultWrapper: () => void
  saveOriginalWrapper: () => void
  openSamplingEditor: () => void
  handleControlEvent: (event: ControlEvent) => void
}

/**
 * 纹理生成器的共享逻辑可组合函数
 */
export function useTextureGenerator(options: UseTextureGeneratorOptions = {}): UseTextureGeneratorReturn {
  const {
    enableCamera = false,
    initialMaxResolution = 4096,
    initialBorderSize = 20
  } = options

  // 响应式数据
  const originalImage = ref<string | null>(null)
  const rawOriginalImage = ref<string | null>(null)
  const processedImage = ref<string | null>(null)
  const borderSize = ref(initialBorderSize)
  const maxResolution = ref(initialMaxResolution)
  const splitPosition = ref(0.5)
  const isProcessing = ref(false)
  const isSampling = ref(false)
  const errorMessage = ref('')
  const viewerRef = ref()
  const zoomLevel = ref(1)
  const magnifierEnabled = ref(true)
  const isMobile = ref(false)
  const cameraActive = ref(false)
  const supportsNativeCamera = ref(false)
  const lutEnabled = ref(false)
  const lutIntensity = ref(1.0)
  const lutFileName = ref<string | null>(null)
  const lutFile = ref<File | null>(null)
  const maskGenerator = ref<(() => Promise<Uint8Array | null>) | null>(null)

  // 初始化设备检测
  onMounted(() => {
    isMobile.value = isMobileDevice()
    if (enableCamera) {
      supportsNativeCamera.value = checkNativeCameraSupport()
    }
  })

  // 监听原始图像和最大分辨率的变化，更新显示的图像
  watchImageChanges(
    rawOriginalImage,
    maxResolution,
    originalImage,
    (message) => { errorMessage.value = message }
  )

  // 处理图像上传
  const handleImageUploadWrapper = (event: Event) => {
    uploadHandler(event, (imageData: string) => {
      rawOriginalImage.value = imageData
      processedImage.value = null
      errorMessage.value = ''
    })
  }

  // 加载示例图像
  const loadSampleImageWrapper = () => {
    loadSample((imageData: string) => {
      rawOriginalImage.value = imageData
      processedImage.value = null
      errorMessage.value = ''
    })
  }

  // 打开/关闭摄像头
  const toggleCameraWrapper = () => {
    if (!enableCamera) return
    toggleCamera(cameraActive.value, (active: boolean) => {
      cameraActive.value = active
    })
  }

  // 处理摄像头拍照结果
  const handlePhotoCapturedWrapper = (imageData: string) => {
    if (!enableCamera) return
    handlePhotoCaptured(
      imageData,
      (updatedImageData: string) => {
        rawOriginalImage.value = updatedImageData
        processedImage.value = null
      },
      (message: string) => { errorMessage.value = message }
    )
  }

  // 处理摄像头错误
  const handleCameraErrorWrapper = (message: string) => {
    if (!enableCamera) return
    handleCameraError(message, (errorMsg: string) => {
      errorMessage.value = errorMsg
    })
  }

  // 处理采样确认
  const handleSamplingConfirmWrapper = (imageData: string) => {
    samplingConfirm(imageData, (updatedImageData: string) => {
      originalImage.value = updatedImageData
      processedImage.value = null
    })
  }

  // 处理图像
  const processImage = async () => {
    if (!originalImage.value) return

    try {
      let maskData: Uint8Array | undefined
      if (maskGenerator.value) {
        const mask = await maskGenerator.value()
        if (mask) {
          maskData = mask
        }
      }

      processedImage.value = await processImageToTileable(
        originalImage.value,
        maxResolution.value,
        borderSize.value,
        () => { isProcessing.value = true },
        () => { isProcessing.value = false },
        (message) => { errorMessage.value = message },
        lutFile.value,
        lutIntensity.value,
        maskData
      )
    } catch (error) {
      console.error('处理图像时出错:', error)
    }
  }

  // 防抖的图像处理函数
  let debounceTimer: NodeJS.Timeout | null = null
  const debouncedProcessImage = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      processImage()
    }, 300)
  }

  // 切换放大镜
  const toggleMagnifierWrapper = () => {
    toggleMag(magnifierEnabled.value, (enabled: boolean) => {
      magnifierEnabled.value = enabled
    })
  }

  const resetZoomWrapper = () => {
    resetZoomFunc(() => {
      zoomLevel.value = 1
    }, viewerRef)
  }

  // 保存结果
  const saveResultWrapper = () => {
    saveRes(processedImage.value, saveProcessedImage)
  }

  // 保存原始图像
  const saveOriginalWrapper = () => {
    saveOrig(originalImage.value, saveOriginalImage)
  }

  // 打开采样编辑器
  const openSamplingEditor = () => {
    isSampling.value = true
  }

  // 统一的事件处理器
  const handleControlEvent = createControlEventHandler({
    onLoadSampleImage: loadSampleImageWrapper,
    onToggleCamera: enableCamera ? toggleCameraWrapper : undefined,
    onProcessImage: processImage,
    onToggleMagnifier: toggleMagnifierWrapper,
    onResetZoom: resetZoomWrapper,
    onSaveResult: saveResultWrapper,
    onSaveOriginal: saveOriginalWrapper,
    onOpenSamplingEditor: openSamplingEditor,
    onImageUpload: handleImageUploadWrapper,
    onPhotoCaptured: enableCamera ? handlePhotoCapturedWrapper : undefined,
    onCameraError: enableCamera ? handleCameraErrorWrapper : undefined,
    onMaxResolution: (value) => { maxResolution.value = value },
    onBorderSize: (value) => { borderSize.value = value },
    onSplitPosition: (value) => { splitPosition.value = value },
    onZoomLevel: (value) => { zoomLevel.value = value },
    onToggleLUT: () => { lutEnabled.value = !lutEnabled.value },
    onClearLUT: () => {
      lutFileName.value = null
      lutFile.value = null
    },
    onLUTIntensity: (value) => {
      lutIntensity.value = value
      // 当 LUT 强度改变时，如果有原始图像和 LUT 文件，重新处理它
      if (originalImage.value && lutFile.value) {
        debouncedProcessImage()
      }
    },
    onLUTFileChange: async (file: File) => {
      try {
        lutFile.value = file
        lutFileName.value = file.name
      } catch (error) {
        console.error('Failed to load LUT file:', error)
        errorMessage.value = 'Failed to load LUT file'
      }
    },
    onMaskUpdate: (generator) => {
      maskGenerator.value = generator
      // 如果有 maskGenerator，重新处理图像
      if (originalImage.value && lutFile.value) {
        debouncedProcessImage()
      }
    },
  })

  return {
    originalImage,
    rawOriginalImage,
    processedImage,
    borderSize,
    maxResolution,
    splitPosition,
    isProcessing,
    isSampling,
    errorMessage,
    viewerRef,
    zoomLevel,
    magnifierEnabled,
    isMobile,
    cameraActive,
    supportsNativeCamera,
    lutEnabled,
    lutIntensity,
    lutFileName,
    lutFile,
    maskGenerator,
    handleImageUploadWrapper,
    loadSampleImageWrapper,
    toggleCameraWrapper,
    handlePhotoCapturedWrapper,
    handleCameraErrorWrapper,
    handleSamplingConfirmWrapper,
    processImage,
    toggleMagnifierWrapper,
    resetZoomWrapper,
    saveResultWrapper,
    saveOriginalWrapper,
    openSamplingEditor,
    handleControlEvent,
  }
}