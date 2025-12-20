// Vue
import { ref, onUnmounted, shallowRef, type Ref, type ShallowRef } from 'vue'

// WebGPU Utils
import { loadTexture, createOutputTexture, copyTextureToCanvas } from '../../../utils/webgpu/textureUtils'


// But `getWebGPUDevice` is needed.
import { getWebGPUDevice } from '../../../utils/webgpu/deviceCache/webgpuDevice'

export {
    ref, onUnmounted, shallowRef,
    Ref, ShallowRef,
    loadTexture, createOutputTexture, copyTextureToCanvas,
    getWebGPUDevice
}
