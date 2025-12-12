// Vue
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'

// Utils
import { isMobileDevice, supportsNativeCamera } from '../utils/deviceDetection'
import { handlePhotoCaptured, handleCameraError, toggleCamera } from '../utils/device/cameraHandlers'

// Adjustments
import type { DehazeParams } from '../adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarityAdjustment'
import type { LuminanceAdjustmentParams } from '../adjustments/imports'

export { ref, onMounted, isMobileDevice, supportsNativeCamera, handlePhotoCaptured, handleCameraError, toggleCamera }
export type { Ref, DehazeParams, ClarityParams, LuminanceAdjustmentParams }