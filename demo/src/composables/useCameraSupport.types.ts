import type { Ref } from './imports'

/**
 * 摄像头功能支持返回值类型
 */
export type CameraSupport = {
    isMobile: Ref<boolean>
    cameraActive: Ref<boolean>
    supportsNativeCamera: Ref<boolean>
    toggleCameraWrapper: () => void
    handlePhotoCapturedWrapper: (
        imageData: string,
        onSuccess: (data: string) => void,
        onError: (msg: string) => void
    ) => void
    handleCameraErrorWrapper: (message: string, onError: (msg: string) => void) => void
}