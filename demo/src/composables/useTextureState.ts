import { ref } from './imports'
import { useProjectState } from './project-state/index'
import type { UseTextureStateOptions, PreviewOverlayData, TextureState } from './useTextureState.types'
export type { UseTextureStateOptions, PreviewOverlayData, TextureState }
import { 创建原图代理, 创建参数代理 } from './useTextureState.ctx'
import { 默认最大分辨率, 默认边框大小, 分割位置初始值, 缩放层级初始值 } from './useTextureState.constants'

/**
 * 纹理生成器的响应式状态管理
 */
export function useTextureState(options: UseTextureStateOptions = {}): TextureState {
    const {
        initialMaxResolution = 默认最大分辨率,
        initialBorderSize = 默认边框大小
    } = options

    const projectState = useProjectState()

    // === 图像状态 ===
    const originalImage = ref<string | null>(null)
    const rawOriginalImage = 创建原图代理(projectState)
    const processedImage = ref<string | null>(null)

    // === 处理参数 ===
    const borderSize = 创建参数代理(projectState, 'borderSize', initialBorderSize)
    const maxResolution = 创建参数代理(projectState, 'maxResolution', initialMaxResolution)
    const splitPosition = ref(分割位置初始值)

    // === UI 状态 ===
    const isProcessing = ref(false)
    const isSampling = ref(false)
    const errorMessage = ref('')
    const viewerRef = ref()
    const zoomLevel = ref(缩放层级初始值)
    const magnifierEnabled = ref(true)

    // === 预览覆盖层 ===
    const previewOverlay = ref<PreviewOverlayData | null>(null)

    return {
        originalImage,
        rawOriginalImage,
        processedImage,
        borderSize,
        maxResolution,
        splitPosition,
        isProcessing,
        isSampling,
        errorMessage,
        viewerRef,
        zoomLevel,
        magnifierEnabled,
        previewOverlay,
    }
}

