// Vue
import { ref, onMounted, reactive, watch } from 'vue'
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


// Procedural Textures
import { defaultWoodParams, type WoodParams } from '../proceduralTexturing/wood/woodGeneratorPipeline'
import { defaultPlainWeaveAdvancedParams } from '../proceduralTexturing/fabrics/plainWeaveAdvanced/plainWeaveAdvancedGenerator'
import type { PlainWeaveAdvancedParams } from '../proceduralTexturing/fabrics/plainWeaveAdvanced/plainWeaveAdvanced.types'

export {
    ref,
    onMounted,
    reactive,
    watch,
    isMobileDevice,
    supportsNativeCamera,
    handlePhotoCaptured,
    toggleCamera,
    createControlEventHandler,
    defaultWoodParams,
    defaultPlainWeaveAdvancedParams
}

export type {
    Ref,
    Component,
    ControlEvent,
    DehazeParams,
    ClarityParams,
    LuminanceAdjustmentParams,
    HSLAdjustmentLayer,
    WoodParams,
    PlainWeaveAdvancedParams
}