import type { Component, HSLAdjustmentLayer, DehazeParams, ClarityParams, LuminanceAdjustmentParams, ControlEvent, 水印配置 } from './imports'
import { createControlEventHandler } from './imports'
import type { ControlEventDeps } from './useControlEventConfig.types'


/**
 * 创建控制事件处理器
 */
export function createTextureControlEventHandler(deps: ControlEventDeps): (event: ControlEvent) => void {
    const { state, adjustmentParams, lutControl, cameraSupport, hslAdjustment, imageHandling, maskGenerator, enableCamera, processImage, debouncedProcessImage, toggleMagnifierWrapper, setPreviewOverlay } = deps

    return createControlEventHandler({
        onLoadSampleImage: imageHandling.loadSampleImageWrapper,
        onToggleCamera: enableCamera ? cameraSupport.toggleCameraWrapper : undefined,
        onProcessImage: processImage,
        onToggleMagnifier: toggleMagnifierWrapper,
        onResetZoom: imageHandling.resetZoomWrapper,
        onSaveResult: imageHandling.saveResultWrapper,
        onSaveOriginal: imageHandling.saveOriginalWrapper,
        onOpenSamplingEditor: imageHandling.openSamplingEditor,
        onImageUpload: imageHandling.handleImageUploadWrapper,
        onPhotoCaptured: enableCamera ? (imageData: string): void => cameraSupport.handlePhotoCapturedWrapper(imageData, (data) => { state.rawOriginalImage.value = data; state.processedImage.value = null }, (msg) => { state.errorMessage.value = msg }) : undefined,
        onCameraError: enableCamera ? (msg: string): void => cameraSupport.handleCameraErrorWrapper(msg, (errMsg) => { state.errorMessage.value = errMsg }) : undefined,
        onMaxResolution: (value: number): void => { state.maxResolution.value = value },
        onBorderSize: (value: number): void => { state.borderSize.value = value },
        onSplitPosition: (value: number): void => { state.splitPosition.value = value },
        onZoomLevel: (value: number): void => { state.zoomLevel.value = value },
        onToggleLUT: lutControl.toggleLUT,
        onClearLUT: lutControl.clearLUT,
        onLUTIntensity: (value: number): void => { lutControl.setLUTIntensity(value); if (state.originalImage.value && lutControl.lutFile.value) debouncedProcessImage() },
        onLUTFileChange: async (file: File): Promise<void> => { try { lutControl.setLUTFile(file) } catch (error) { console.error('Failed to load LUT file:', error); state.errorMessage.value = 'Failed to load LUT file' } },
        onMaskUpdate: (generator: (() => Promise<Uint8Array | null>) | null): void => { maskGenerator.value = generator; if (state.originalImage.value && lutControl.lutFile.value) debouncedProcessImage() },
        onSetPreviewOverlay: (data: unknown, component: Component): void => setPreviewOverlay(data, component),
        onGlobalHSLChange: (layer: HSLAdjustmentLayer): void => { hslAdjustment.updateGlobalHSL(layer); if (state.originalImage.value) debouncedProcessImage() },
        onAddHSLLayer: (layer: HSLAdjustmentLayer): void => { hslAdjustment.addHSLLayer(layer); if (state.originalImage.value) debouncedProcessImage() },
        onUpdateHSLLayer: (id: string, updates: Partial<HSLAdjustmentLayer>): void => { hslAdjustment.updateHSLLayer(id, updates); if (state.originalImage.value) debouncedProcessImage() },
        onRemoveHSLLayer: (id: string): void => { hslAdjustment.removeHSLLayer(id); if (state.originalImage.value) debouncedProcessImage() },
        onExposureStrength: (strength: number): void => { adjustmentParams.exposureStrength.value = strength; if (state.originalImage.value) debouncedProcessImage() },
        onExposureManual: (params: { exposure: number; contrast: number; gamma: number }): void => { adjustmentParams.exposureManual.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onDehazeChange: (params: DehazeParams): void => { adjustmentParams.dehazeParams.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onClarityAdjustment: (params: ClarityParams): void => { adjustmentParams.clarityParams.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onLuminanceAdjustment: (params: LuminanceAdjustmentParams): void => { adjustmentParams.luminanceParams.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onSetImage: imageHandling.setImage,
        onWatermarkConfigChange: (config: 水印配置): void => { deps.watermarkConfig.value = config; deps.enableWatermark.value = true; if (state.originalImage.value) debouncedProcessImage() },
        onWatermarkEnableChange: (enabled: boolean): void => { deps.enableWatermark.value = enabled; if (state.originalImage.value) debouncedProcessImage() },
    })
}
