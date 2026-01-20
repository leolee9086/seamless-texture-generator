import type { UseTextureStateOptions, TextureState } from './useTextureState'
import type { AdjustmentParams } from './useAdjustmentParams'
import type { LUTControl } from './useLUTControl'
import type { Ref } from './imports'
import type { 水印配置 } from './imports'

/** UseTextureGenerator 选项接口 */
export interface UseTextureGeneratorOptions extends UseTextureStateOptions {
    /** 是否启用摄像头支持 */
    enableCamera?: boolean
}

/**
 * 纹理监听器上下文
 */
export interface TextureWatchersContext {
    state: TextureState
    adjustmentParams: AdjustmentParams
    lutControl: LUTControl
    enableWatermark: Ref<boolean>
    watermarkConfig: Ref<水印配置>
    debouncedProcessImage: () => void
}
