import { ref } from './imports'
import type { Component } from './imports'
import { processImageToTileable } from './imports'
import { useTextureState } from './useTextureState'
import { useAdjustmentParams } from './useAdjustmentParams'
import { useLUTControl } from './useLUTControl'
import { useWatermarkState } from './useWatermarkState'
import { useCameraSupport } from './useCameraSupport'
import { useHSLAdjustment } from './useHSLAdjustment'
import { useImageHandling } from './useImageHandling'
import { createTextureControlEventHandler } from './useControlEventConfig'
import { setupTextureWatchers } from './useTextureGenerator.watch'
import type { UseTextureGeneratorOptions } from './useTextureGenerator.types'

/** 纹理生成器的共享逻辑可组合函数 */
export function useTextureGenerator(options: UseTextureGeneratorOptions = {}) {
  const { enableCamera = false } = options
  const state = useTextureState(options)
  const adjustmentParams = useAdjustmentParams()
  const lutControl = useLUTControl()
  const watermarkState = useWatermarkState()
  const cameraSupport = useCameraSupport(enableCamera)
  const hslAdjustment = useHSLAdjustment(adjustmentParams.globalHSL, adjustmentParams.hslLayers)
  const imageHandling = useImageHandling({
    rawOriginalImage: state.rawOriginalImage,
    originalImage: state.originalImage,
    processedImage: state.processedImage,
    maxResolution: state.maxResolution,
    errorMessage: state.errorMessage,
    viewerRef: state.viewerRef,
    zoomLevel: state.zoomLevel,
    isSampling: state.isSampling
  })

  const maskGenerator = ref<(() => Promise<Uint8Array | null>) | null>(null)

  const processImage = async () => {
    if (!state.originalImage.value) return
    try {
      const maskData = maskGenerator.value ? await maskGenerator.value() ?? undefined : undefined

      state.processedImage.value = await processImageToTileable({
        originalImage: state.originalImage.value,
        maxResolution: state.maxResolution.value,
        borderSize: state.borderSize.value,
        onProcessingStart: () => { state.isProcessing.value = true },
        onProcessingEnd: () => { state.isProcessing.value = false },
        onError: (msg) => { state.errorMessage.value = msg },
        lutFile: lutControl.lutFile.value,
        lutIntensity: lutControl.lutIntensity.value,
        maskData,
        hslLayers: hslAdjustment.buildHSLLayers(),
        exposureStrength: adjustmentParams.exposureStrength.value,
        exposureMode: adjustmentParams.exposureMode.value,
        claheConfig: adjustmentParams.claheConfig.value,
        exposureManual: adjustmentParams.exposureManual.value,
        dehazeParams: adjustmentParams.dehazeParams.value,
        clarityParams: adjustmentParams.clarityParams.value,
        luminanceParams: adjustmentParams.luminanceParams.value,
        watermarkConfig: watermarkState.watermarkConfig.value,
        enableWatermark: watermarkState.enableWatermark.value
      })
    } catch (error) {
      console.error('处理图像时出错:', error)
    }
  }

  let debounceTimer: NodeJS.Timeout | null = null
  const debouncedProcessImage = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => processImage(), 300)
  }


  const toggleMagnifierWrapper = (): void => { state.magnifierEnabled.value = !state.magnifierEnabled.value }

  /** @简洁函数 设置预览叠加层 */
  const setPreviewOverlay = (data: unknown, component: Component) => {
    state.previewOverlay.value = (!data || !component) ? null : { data, component }
  }
  const clearPreviewOverlay = () => { state.previewOverlay.value = null }

  // 设置状态监听器
  setupTextureWatchers({
    state,
    adjustmentParams,
    lutControl,
    enableWatermark: watermarkState.enableWatermark,
    watermarkConfig: watermarkState.watermarkConfig,
    debouncedProcessImage
  })

  const handleControlEvent = createTextureControlEventHandler({
    state,
    adjustmentParams,
    lutControl,
    cameraSupport,
    hslAdjustment,
    imageHandling,
    maskGenerator,
    enableCamera,
    processImage,
    debouncedProcessImage,
    toggleMagnifierWrapper,
    setPreviewOverlay,
    watermarkConfig: watermarkState.watermarkConfig,
    enableWatermark: watermarkState.enableWatermark
  })

  return {
    ...state, ...adjustmentParams, ...lutControl, maskGenerator,
    watermarkConfig: watermarkState.watermarkConfig,
    enableWatermark: watermarkState.enableWatermark,
    isMobile: cameraSupport.isMobile,
    cameraActive: cameraSupport.cameraActive,
    supportsNativeCamera: cameraSupport.supportsNativeCamera,
    handleImageUploadWrapper: imageHandling.handleImageUploadWrapper,
    loadSampleImageWrapper: imageHandling.loadSampleImageWrapper,
    toggleCameraWrapper: cameraSupport.toggleCameraWrapper,
    handlePhotoCapturedWrapper: (imageData: string) => cameraSupport.handlePhotoCapturedWrapper(imageData, (data) => {
      state.rawOriginalImage.value = data;
      state.processedImage.value = null
    }, (message) => { state.errorMessage.value = message }),
    handleCameraErrorWrapper: (msg: string) => cameraSupport.handleCameraErrorWrapper(msg, (errMsg) => { state.errorMessage.value = errMsg }),
    handleSamplingConfirmWrapper: imageHandling.handleSamplingConfirmWrapper,
    processImage,
    toggleMagnifierWrapper,
    resetZoomWrapper: imageHandling.resetZoomWrapper,
    saveResultWrapper: imageHandling.saveResultWrapper,
    saveOriginalWrapper: imageHandling.saveOriginalWrapper,
    openSamplingEditor: imageHandling.openSamplingEditor,
    handleControlEvent,
    setPreviewOverlay,
    clearPreviewOverlay,
  }
}