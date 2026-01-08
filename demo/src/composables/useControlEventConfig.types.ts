import { type Ref, type Component } from 'vue'
import type { TextureState } from './useTextureState'
import type { AdjustmentParams } from './useAdjustmentParams.types'
import type { LUTControl } from './useLUTControl'
import type { CameraSupport } from './useCameraSupport.types'
import type { HSLAdjustment } from './useHSLAdjustment'
import type { ImageHandling } from './useImageHandling'
import type { 水印配置 } from './imports'

/** 创建事件处理器配置所需的依赖 */
export interface ControlEventDeps {
    state: TextureState
    adjustmentParams: AdjustmentParams
    lutControl: LUTControl
    cameraSupport: CameraSupport
    hslAdjustment: HSLAdjustment
    imageHandling: ImageHandling
    maskGenerator: Ref<(() => Promise<Uint8Array | null>) | null>
    enableCamera: boolean
    processImage: () => Promise<void>
    debouncedProcessImage: () => void
    toggleMagnifierWrapper: () => void
    setPreviewOverlay: (data: unknown, component: Component) => void
    watermarkConfig: Ref<水印配置>
    enableWatermark: Ref<boolean>
}
