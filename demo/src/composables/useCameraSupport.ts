import { ref, onMounted, isMobileDevice, supportsNativeCamera, handlePhotoCaptured, toggleCamera } from './imports'
import type { CameraSupport } from './useCameraSupport.types'

/**
 * 摄像头功能支持
 */
export function useCameraSupport(enableCamera: boolean = false): CameraSupport {
    const isMobile = ref(false)
    const cameraActive = ref(false)
    const supportsNativeCameraRef = ref(false)

    // 初始化设备检测
    onMounted(() => {
        isMobile.value = isMobileDevice()
        if (enableCamera) {
            supportsNativeCameraRef.value = supportsNativeCamera()
        }
    })

    /** 切换摄像头 */
    const toggleCameraWrapper = (): void => {
        if (!enableCamera) return
        toggleCamera(cameraActive.value, (active: boolean) => {
            cameraActive.value = active
        })
    }

    /** 处理拍照结果 */
    const handlePhotoCapturedWrapper = (
        imageData: string,
        onSuccess: (data: string) => void,
        onError: (msg: string) => void
    ): void => {
        if (!enableCamera) return
        handlePhotoCaptured(imageData, onSuccess, onError)
    }

    /** 处理摄像头错误 */
    const handleCameraErrorWrapper = (message: string, onError: (msg: string) => void): void => {
        if (!enableCamera) return
        // 直接调用错误处理回调，消除不必要的中间层
        onError(message)
    }

    return {
        isMobile,
        cameraActive,
        supportsNativeCamera: supportsNativeCameraRef,
        toggleCameraWrapper,
        handlePhotoCapturedWrapper,
        handleCameraErrorWrapper,
    }
}

