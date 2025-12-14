// Vue
import { ref, onUnmounted, shallowRef, type Ref, type ShallowRef } from 'vue'

// WebGPU Utils
import { loadTexture, createOutputTexture, copyTextureToCanvas } from '../../../utils/webgpu/textureUtils'

// Module Imports
import { AdvancedCompositor } from '../GrayscaleCompositor/imports' // Re-use the export from GrayscaleCompositor which points to this module? Circular?
// Wait, AdvancedCompositor is exported from THIS module's index.ts.
// But useAdvancedCompositor.ts imports AdvancedCompositor.
// Let's import directly from index.ts but we are in the same folder.
// So we don't need to forward local imports.

// But `getWebGPUDevice` is needed.
import { getWebGPUDevice } from '../../../utils/webgpu/deviceCache/webgpuDevice'

export {
    ref, onUnmounted, shallowRef,
    Ref, ShallowRef,
    loadTexture, createOutputTexture, copyTextureToCanvas,
    getWebGPUDevice
}
