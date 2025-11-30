<template>
    <div
        class="w-screen h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans relative overflow-hidden flex flex-row">
        <!-- GitHub Link -->
        <a href="https://github.com/leolee9086/seamless-texture-generator" target="_blank" rel="noopener noreferrer"
            class="fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-700/80 to-gray-900/80 text-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-110 active:scale-95 backdrop-blur-sm"
            title="View on GitHub">
            <div class="i-carbon-logo-github text-xl"></div>
        </a>

        <!-- Viewer Area (Left) -->
        <div class="flex-1 relative z-0 overflow-hidden m-4 rounded-3xl shadow-inner bg-darkglass-200">
            <Viewer ref="viewerRef" :original-image="originalImage" :processed-image="processedImage"
                v-model:split-position="splitPosition" :magnifier-enabled="magnifierEnabled"
                :is-processing="isProcessing" :error-message="errorMessage" :zoom-level="zoomLevel"
                class="w-full h-full object-contain" />
        </div>

        <!-- Controls Area (Right) -->
        <div class="z-20 p-4 glass-panel m-4 ml-0 w-96 min-w-96 overflow-y-auto scrollbar-hide">
            <Controls :is-processing="isProcessing" :camera-active="cameraActive"
                :supports-native-camera="supportsNativeCamera" :original-image="originalImage"
                :processed-image="processedImage" :max-resolution="maxResolution" :border-size="borderSize"
                :split-position="splitPosition" :magnifier-enabled="magnifierEnabled" :zoom-level="zoomLevel"
                @control-event="handleControlEvent" />
        </div>


    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { makeTileable } from '../../src/lib/HistogramPreservingBlendMakeTileable'
import Controls from './components/Controls.vue'
import Viewer from './components/Viewer.vue'
import type { ControlEvent } from './types/controlEvents'

// 响应式数据
const originalImage = ref<string | null>(null)
const rawOriginalImage = ref<string | null>(null)
const processedImage = ref<string | null>(null)
const borderSize = ref(20)
const maxResolution = ref(4096)
const splitPosition = ref(0.5)
const isProcessing = ref(false)
const errorMessage = ref('')
const viewerRef = ref()

// 摄像头相关状态
const cameraActive = ref(false)
const supportsNativeCamera = ref(false)

// 移动端检测
const isMobile = ref(false)

// 缩放相关状态
const zoomLevel = ref(1)

// 放大镜配置
const magnifierEnabled = ref(true)

// 检测是否支持原生相机
const checkNativeCameraSupport = () => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    isMobile.value = mobile
    const hasCaptureSupport = 'capture' in document.createElement('input')
    supportsNativeCamera.value = mobile && hasCaptureSupport
}

// 初始化时检测相机支持
onMounted(() => {
    checkNativeCameraSupport()
})

// 统一的事件处理器
const handleControlEvent = (event: ControlEvent) => {
    const { type, detail } = event

    if (type === 'button-click') {
        switch (detail.action) {
            case 'load-sample-image':
                loadSampleImage()
                break
            case 'toggle-camera':
                toggleCamera()
                break
            case 'process-image':
                processImage()
                break
            case 'toggle-magnifier':
                toggleMagnifier()
                break
            case 'reset-zoom':
                resetZoom()
                break
            case 'save-result':
                saveResult()
                break
        }
    } else if (type === 'update-data') {
        switch (detail.action) {
            case 'image-upload':
                handleImageUpload(detail.data)
                break
            case 'photo-captured':
                handlePhotoCaptured(detail.data)
                break
            case 'camera-error':
                handleCameraError(detail.data)
                break
            case 'max-resolution':
                maxResolution.value = detail.data
                break
            case 'border-size':
                borderSize.value = detail.data
                break
            case 'split-position':
                splitPosition.value = detail.data
                break
            case 'zoom-level':
                zoomLevel.value = detail.data
                break
        }
    }
}

// 处理图像上传
const handleImageUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            rawOriginalImage.value = e.target?.result as string
            processedImage.value = null
            errorMessage.value = ''
        }
        reader.readAsDataURL(file)
    }
}

// 加载示例图像
const loadSampleImage = () => {
    rawOriginalImage.value = 'https://picsum.photos/seed/texture/512/512.jpg'
    processedImage.value = null
    errorMessage.value = ''
}

// 打开/关闭摄像头
const toggleCamera = () => {
    cameraActive.value = !cameraActive.value
}

// 处理摄像头拍照结果
const handlePhotoCaptured = (imageData: string) => {
    rawOriginalImage.value = imageData
    processedImage.value = null
    errorMessage.value = ''
}

// 处理摄像头错误
const handleCameraError = (message: string) => {
    errorMessage.value = message
}

// 缩放图像到指定最大分辨率
const scaleImageToMaxResolution = (img: HTMLImageElement, maxRes: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const maxDimension = Math.max(img.width, img.height)

    if (maxDimension <= maxRes) {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        return canvas
    }

    const scale = maxRes / maxDimension
    const newWidth = Math.round(img.width * scale)
    const newHeight = Math.round(img.height * scale)

    canvas.width = newWidth
    canvas.height = newHeight

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(img, 0, 0, newWidth, newHeight)

    return canvas
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

// 监听原始图像和最大分辨率的变化，更新显示的图像
watch([rawOriginalImage, maxResolution], async ([newRaw, newMaxRes]) => {
    if (!newRaw) {
        originalImage.value = null
        return
    }

    try {
        const img = await loadImage(newRaw)
        const scaledCanvas = scaleImageToMaxResolution(img, newMaxRes)
        originalImage.value = scaledCanvas.toDataURL()
    } catch (error) {
        console.error('加载或缩放图像时出错:', error)
        errorMessage.value = '加载图像失败'
    }
})

// 处理图像
const processImage = async () => {
    if (!originalImage.value) return

    isProcessing.value = true
    errorMessage.value = ''

    try {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = originalImage.value!
        })

        const scaledCanvas = scaleImageToMaxResolution(img, maxResolution.value)
        const imageData = scaledCanvas.getContext('2d')!.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height)
        const processedImageData = await makeTileable(imageData, borderSize.value, null)

        const processedCanvas = document.createElement('canvas')
        processedCanvas.width = processedImageData.width
        processedCanvas.height = processedImageData.height
        const processedCtx = processedCanvas.getContext('2d')!
        processedCtx.putImageData(processedImageData, 0, 0)

        processedImage.value = processedCanvas.toDataURL()
    } catch (error) {
        console.error('处理图像时出错:', error)
        errorMessage.value = `处理图像时出错: ${error instanceof Error ? error.message : '未知错误'}`
    } finally {
        isProcessing.value = false
    }
}

// 切换放大镜
const toggleMagnifier = () => {
    magnifierEnabled.value = !magnifierEnabled.value
}

const resetZoom = () => {
    zoomLevel.value = 1
    if (viewerRef.value) {
        viewerRef.value.resetZoom()
    }
}

// 保存结果
const saveResult = () => {
    if (!processedImage.value) return

    const link = document.createElement('a')
    link.href = processedImage.value
    link.download = `seamless-texture-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
</script>

<style>
/* Global scrollbar hide */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
