import { type Component } from 'vue'
import type { HSLAdjustmentLayer } from '../adjustments/hsl/hslAdjustStep'
import { createControlEventHandler } from '../utils/controlEventHandler'
import type { DehazeParams } from '@/adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarityAdjustment'
import type { LuminanceAdjustmentParams } from '../adjustments/luminanceAdjustment'



import type { ControlEventDeps } from './useControlEventConfig.types'


/**
 * 创建控制事件处理器
 */
export function createTextureControlEventHandler(deps: ControlEventDeps) {
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
        onPhotoCaptured: enableCamera ? (imageData: string) => cameraSupport.handlePhotoCapturedWrapper(imageData, (data) => { state.rawOriginalImage.value = data; state.processedImage.value = null }, (msg) => { state.errorMessage.value = msg }) : undefined,
        onCameraError: enableCamera ? (msg: string) => cameraSupport.handleCameraErrorWrapper(msg, (errMsg) => { state.errorMessage.value = errMsg }) : undefined,
        onMaxResolution: (value) => { state.maxResolution.value = value },
        onBorderSize: (value) => { state.borderSize.value = value },
        onSplitPosition: (value) => { state.splitPosition.value = value },
        onZoomLevel: (value) => { state.zoomLevel.value = value },
        onToggleLUT: lutControl.toggleLUT,
        onClearLUT: lutControl.clearLUT,
        onLUTIntensity: (value) => { lutControl.setLUTIntensity(value); if (state.originalImage.value && lutControl.lutFile.value) debouncedProcessImage() },
        onLUTFileChange: async (file: File) => { try { lutControl.setLUTFile(file) } catch (e) { console.error('Failed to load LUT file:', e); state.errorMessage.value = 'Failed to load LUT file' } },
        onMaskUpdate: (generator) => { maskGenerator.value = generator; if (state.originalImage.value && lutControl.lutFile.value) debouncedProcessImage() },
        onSetPreviewOverlay: (data: unknown, component: Component) => setPreviewOverlay(data, component),
        onGlobalHSLChange: (layer: HSLAdjustmentLayer) => { hslAdjustment.updateGlobalHSL(layer); if (state.originalImage.value) debouncedProcessImage() },
        onAddHSLLayer: (layer: HSLAdjustmentLayer) => { hslAdjustment.addHSLLayer(layer); if (state.originalImage.value) debouncedProcessImage() },
        onUpdateHSLLayer: (id: string, updates: Partial<HSLAdjustmentLayer>) => { hslAdjustment.updateHSLLayer(id, updates); if (state.originalImage.value) debouncedProcessImage() },
        onRemoveHSLLayer: (id: string) => { hslAdjustment.removeHSLLayer(id); if (state.originalImage.value) debouncedProcessImage() },
        onExposureStrength: (strength: number) => { adjustmentParams.exposureStrength.value = strength; if (state.originalImage.value) debouncedProcessImage() },
        onExposureManual: (params: { exposure: number; contrast: number; gamma: number }) => { adjustmentParams.exposureManual.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onDehazeChange: (params: DehazeParams) => { adjustmentParams.dehazeParams.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onClarityAdjustment: (params: ClarityParams) => { adjustmentParams.clarityParams.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onLuminanceAdjustment: (params: LuminanceAdjustmentParams) => { adjustmentParams.luminanceParams.value = params; if (state.originalImage.value) debouncedProcessImage() },
        onSetImage: imageHandling.setImage,
    })
}
