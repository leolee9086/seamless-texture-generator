import { ref, onMounted, type Ref, type Component, markRaw } from 'vue'
import { processImageToTileable } from '../processPipelines/imageProcessor'
import type { HSLAdjustmentLayer } from '../adjustments/hsl/hslAdjustStep'  // 新增这行
import {
  handleImageUpload as uploadHandler,
  resetZoom as resetZoomFunc,
  保存图像
} from '../utils/imageHandlers'
import { isMobileDevice, supportsNativeCamera as checkNativeCameraSupport } from '../utils/deviceDetection'
import { watchImageChanges } from '../utils/imageWatcher'
import { handlePhotoCaptured, handleCameraError, toggleCamera } from '../utils/device/cameraHandlers'
import { saveOriginalImage, saveProcessedImage } from '../utils/download'
import { createControlEventHandler } from '../utils/controlEventHandler'
import type { DehazeParams } from '@/adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarityAdjustment'
import type { LuminanceAdjustmentParams } from '../adjustments/luminanceAdjustment'

// 定义overlay数据接口
interface PreviewOverlayData {
  data: any  // 传递给组件的数据
  component: Component  // Vue组件
}

export interface UseTextureGeneratorOptions {
  /** 是否启用摄像头功能（仅桌面端） */
  enableCamera?: boolean
  /** 初始最大分辨率 */
  initialMaxResolution?: number
  /** 初始边框大小 */
  initialBorderSize?: number
}

/**
 * 纹理生成器的共享逻辑可组合函数
 */
export function useTextureGenerator(options: UseTextureGeneratorOptions = {}) {
  const {
    enableCamera = false,
    initialMaxResolution = 4096,
    initialBorderSize = 0
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
  const previewOverlay = ref<PreviewOverlayData | null>(null)
  // HSL调整状态 - 新增
  const globalHSL = ref({
    hue: 0,
    saturation: 0,
    lightness: 0
  })
  const hslLayers = ref<HSLAdjustmentLayer[]>([])
  // 曝光调整状态 - 新增
  const exposureStrength = ref(1.0)
  const exposureManual = ref({
    exposure: 1.0,
    contrast: 1.0,
    gamma: 1.0
  })
  // 去雾调整状态 - 新增
  const dehazeParams = ref<DehazeParams>({
    omega: 0.95,
    t0: 0.1,
    windowSize: 15,
    topRatio: 0.1,
    adaptiveMode: false,
    spatialAdaptiveMode: false,
    adaptiveStrength: 1.0,
    hazeWeight: 0.5,
    atmosphericWeight: 0.3,
    enableEnhancement: false,
    saturationEnhancement: 1.2,
    contrastEnhancement: 1.1,
    brightnessEnhancement: 1.0
  })
  // 清晰度调整状态 - 新增
  const clarityParams = ref<ClarityParams>({
    sigma: 8.0,
    epsilon: 0.04,
    radius: 8,
    blockSize: 16,
    detailStrength: 2.0,
    enhancementStrength: 1.0,
    macroEnhancement: 0.0,
    contrastBoost: 1.2
  })
  // 亮度调整状态 - 新增
  const luminanceParams = ref<LuminanceAdjustmentParams>({
    shadows: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      red: 0,
      green: 0,
      blue: 0
    },
    midtones: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      red: 0,
      green: 0,
      blue: 0
    },
    highlights: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      red: 0,
      green: 0,
      blue: 0
    },
    shadowEnd: 0.33,
    highlightStart: 0.66,
    softness: 0.1
  })

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

  // 加载示例图像（直接使用URL，无需额外函数包装）
  const loadSampleImageWrapper = (): void => {
    rawOriginalImage.value = 'https://picsum.photos/seed/texture/512/512.jpg'
    processedImage.value = null
    errorMessage.value = ''
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

  // 处理采样确认（直接更新状态，无需额外函数包装）
  const handleSamplingConfirmWrapper = (imageData: string): void => {
    originalImage.value = imageData
    processedImage.value = null
  }

  // 构建完整的HSL调整层数组（全局 + 色块层）
  const buildHSLLayers = (): HSLAdjustmentLayer[] => {
    const layers: HSLAdjustmentLayer[] = []

    // 如果有全局HSL调整，添加全局层
    if (globalHSL.value.hue !== 0 || globalHSL.value.saturation !== 0 || globalHSL.value.lightness !== 0) {
      layers.push({
        id: 'global',
        type: 'global',
        targetColor: '#000000',
        hue: globalHSL.value.hue,
        saturation: globalHSL.value.saturation,
        lightness: globalHSL.value.lightness,
        precision: 100,
        range: 100
      })
    }

    // 添加所有色块调整层
    layers.push(...hslLayers.value)

    return layers
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

      processedImage.value = await processImageToTileable({
        originalImage: originalImage.value,
        maxResolution: maxResolution.value,
        borderSize: borderSize.value,
        onProcessingStart: () => { isProcessing.value = true },
        onProcessingEnd: () => { isProcessing.value = false },
        onError: (message) => { errorMessage.value = message },
        lutFile: lutFile.value,
        lutIntensity: lutIntensity.value,
        maskData,
        hslLayers: buildHSLLayers(),
        exposureStrength: exposureStrength.value,
        exposureManual: exposureManual.value,
        dehazeParams: dehazeParams.value,
        clarityParams: clarityParams.value,
        luminanceParams: luminanceParams.value,
      })
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

  // 切换放大镜（直接取反，无需额外函数包装）
  const toggleMagnifierWrapper = (): void => {
    magnifierEnabled.value = !magnifierEnabled.value
  }

  const resetZoomWrapper = () => {
    resetZoomFunc(() => {
      zoomLevel.value = 1
    }, viewerRef)
  }

  // 保存结果
  const saveResultWrapper = (): void => {
    保存图像(processedImage.value, saveProcessedImage)
  }

  // 保存原始图像
  const saveOriginalWrapper = (): void => {
    保存图像(originalImage.value, saveOriginalImage)
  }

  // 打开采样编辑器
  const openSamplingEditor = () => {
    isSampling.value = true
  }

  // 设置预览覆盖层
  const setPreviewOverlay = (data: any, component: Component) => {
    if (!data || !component) {
      previewOverlay.value = null
    } else {
      previewOverlay.value = { data, component }
    }
  }

  // 清除预览覆盖层
  const clearPreviewOverlay = () => {
    previewOverlay.value = null
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
    onSetPreviewOverlay: (data: any, component: Component) => {
      setPreviewOverlay(data, component)
    },
    // HSL处理器 - 新增
    onGlobalHSLChange: (layer: HSLAdjustmentLayer) => {
      globalHSL.value = {
        hue: layer.hue,
        saturation: layer.saturation,
        lightness: layer.lightness
      }
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    onAddHSLLayer: (layer: HSLAdjustmentLayer) => {
      hslLayers.value.push(layer)
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    onUpdateHSLLayer: (id: string, updates: Partial<HSLAdjustmentLayer>) => {
      const layer = hslLayers.value.find(l => l.id === id)
      if (layer) {
        Object.assign(layer, updates)
        if (originalImage.value) {
          debouncedProcessImage()
        }
      }
    },
    onRemoveHSLLayer: (id: string) => {
      hslLayers.value = hslLayers.value.filter(l => l.id !== id)
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    // 曝光调整处理器 - 新增
    onExposureStrength: (strength: number) => {
      exposureStrength.value = strength
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    onExposureManual: (params: { exposure: number; contrast: number; gamma: number }) => {
      exposureManual.value = params
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    // 去雾调整处理器 - 新增
    onDehazeChange: (params: DehazeParams) => {
      dehazeParams.value = params
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    // 清晰度调整处理器 - 新增
    onClarityAdjustment: (params: ClarityParams) => {
      clarityParams.value = params
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    // 亮度调整处理器 - 新增
    onLuminanceAdjustment: (params: LuminanceAdjustmentParams) => {
      luminanceParams.value = params
      if (originalImage.value) {
        debouncedProcessImage()
      }
    },
    onSetImage: (imageData: string) => {
      rawOriginalImage.value = imageData
      processedImage.value = null
      errorMessage.value = ''
    }
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
    previewOverlay,
    globalHSL,
    hslLayers,
    exposureStrength,   // 新增
    exposureManual,     // 新增
    dehazeParams,      // 新增
    clarityParams,      // 新增
    luminanceParams,    // 新增
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
    setPreviewOverlay,
    clearPreviewOverlay,
  }
}