import { ref, onMounted, reactive, watch, computed, shallowRef } from 'vue'
import type { Ref, Component, ComputedRef } from 'vue'
import JSZip from 'jszip'

// Utils
import { isMobileDevice, supportsNativeCamera } from '../utils/common-utils/deviceDetection'
import { handlePhotoCaptured, toggleCamera } from '../utils/device/cameraHandlers'
import { createControlEventHandler } from '../utils/controlEventHandler'
import { convertImage, downloadBlob } from '../utils/imageConvert'

// Types
import type { ControlEvent } from '../utils/imports'
import type { ExportPreset, ExportTask } from '../types/export.types'

// Adjustments
import type { DehazeParams } from '../adjustments/dehaze/types'
import type { ClarityParams } from '../adjustments/clarity'
import type { LuminanceAdjustmentParams } from '../adjustments/imports'
import type { HSLAdjustmentLayer } from '../utils/imports'
import type { 水印配置 } from '../components/control-panels/watermark/watermark.types'

// Project Types
import type { ImageProject, ProjectParams } from '../types/project.types'

// Infra
import { projectFS } from '../infra/ProjectFileSystem'

// Logic
import { processImageToTileable } from '../processPipelines/imageProcessor'
import { blobToDataURL } from './project-state/useProjectState.utils'
import { 默认导出预设 } from '../types/export.types'

// Procedural Textures
import { defaultWoodParams, type WoodParams } from '../proceduralTexturing/wood/woodGeneratorPipeline'
import { defaultPlainWeaveAdvancedParams } from '../proceduralTexturing/fabrics/plainWeaveAdvanced/plainWeaveAdvancedGenerator'
import type { PlainWeaveAdvancedParams } from '../proceduralTexturing/fabrics/plainWeaveAdvanced/plainWeaveAdvanced.types'

export {
    ref,
    onMounted,
    reactive,
    watch,
    computed,
    shallowRef,
    isMobileDevice,
    supportsNativeCamera,
    handlePhotoCaptured,
    toggleCamera,
    createControlEventHandler,
    defaultWoodParams,
    defaultPlainWeaveAdvancedParams,
    projectFS,
    JSZip,
    processImageToTileable,
    blobToDataURL,
    默认导出预设,
    convertImage,
    downloadBlob
}

export type {
    Ref,
    ComputedRef,
    Component,
    ControlEvent,
    DehazeParams,
    ClarityParams,
    LuminanceAdjustmentParams,
    HSLAdjustmentLayer,
    WoodParams,
    PlainWeaveAdvancedParams,
    水印配置,
    ImageProject,
    ProjectParams,
    ExportPreset,
    ExportTask
}