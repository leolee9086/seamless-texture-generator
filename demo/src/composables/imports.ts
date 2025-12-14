// Vue
import { ref, onMounted } from 'vue'
import type { Ref, Component } from 'vue'

// Utils
import { isMobileDevice, supportsNativeCamera } from '../utils/common-utils/deviceDetection'
import { handlePhotoCaptured, toggleCamera } from '../utils/device/cameraHandlers'
import { createControlEventHandler } from '../utils/controlEventHandler'

// Types
import type { ControlEvent } from '../utils/imports'

// Adjustments
import type { DehazeParams } from '../adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../adjustments/imports'
import type { HSLAdjustmentLayer } from '../utils/imports'

export { ref, onMounted, isMobileDevice, supportsNativeCamera, handlePhotoCaptured, toggleCamera, createControlEventHandler }
export type { Ref, Component, ControlEvent, DehazeParams, ClarityParams, LuminanceAdjustmentParams, HSLAdjustmentLayer }