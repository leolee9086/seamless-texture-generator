<template>
  <!-- 支持原生相机时，只显示原生相机按钮 -->
  <template v-if="supportsNativeCamera">
    <input ref="fileInputRef" type="file" accept="image/*" capture="environment" @change="handleFileInput"
      style="display: none" />
    <button @click="openNativeCamera"
      class="glass-btn w-full flex-center gap-2 bg-green-500/20 hover:bg-green-500/30 border-green-500/30">
      <div class="i-carbon-camera text-lg"></div>
      <span>Take Photo</span>
    </button>
  </template>

  <div v-else class="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-glass group">
    <!-- 隐藏的文件输入，支持 capture=camera -->

    <!-- 不支持原生相机时，显示完整的摄像头预览界面 -->
    <template>
      <video ref="videoRef" autoplay muted playsinline webkit-playsinline class="w-full h-full object-cover"
        :class="{ 'fixed inset-0 z-50': isFullscreen }" @loadedmetadata="onVideoLoaded" @error="onVideoError"
        @click="handleVideoClick" @touchstart="handleVideoTouch"></video>

      <!-- 全屏模式下的浮动控制按钮 -->
      <div class="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-[60]" v-if="isFullscreen">
        <button @click="capturePhoto" :disabled="isCapturing"
          class="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-md flex-center active:scale-95 transition-transform">
          <div class="w-12 h-12 rounded-full bg-white"></div>
        </button>
        <button @click="switchCamera" v-if="hasMultipleCameras"
          class="absolute right-8 bottom-4 glass-btn rounded-full p-3">
          <div class="i-carbon-camera-action text-xl"></div>
        </button>
        <button @click="exitFullscreen" class="absolute left-8 bottom-4 glass-btn rounded-full p-3">
          <div class="i-carbon-minimize text-xl"></div>
        </button>
      </div>

      <!-- 非全屏模式下的控制按钮 -->
      <div
        class="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        v-else>
        <button @click="capturePhoto" :disabled="isCapturing"
          class="glass-btn rounded-full p-3 bg-white/20 hover:bg-white/30 border-white/40">
          <div class="i-carbon-camera text-xl"></div>
        </button>
        <button @click="switchCamera" v-if="hasMultipleCameras" class="glass-btn rounded-full p-3">
          <div class="i-carbon-camera-action text-xl"></div>
        </button>
        <button @click="enterFullscreen" v-if="fullscreenSupported" class="glass-btn rounded-full p-3">
          <div class="i-carbon-maximize text-xl"></div>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { requestCameraPermission, captureImage } from '../utils/camera'

// Props
interface Props {
  modelValue?: boolean // 控制摄像头的开关状态
}

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'photo-captured', imageData: string): void
  (e: 'error', message: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const fileInputRef = ref<HTMLInputElement>()
const currentStream = ref<MediaStream | null>(null)
const currentCameraId = ref<string>('')
const availableCameras = ref<MediaDeviceInfo[]>([])
const isCapturing = ref(false)
const isFullscreen = ref(false)
const fullscreenSupported = ref(false)
const supportsNativeCamera = ref(false)

// 计算属性
const cameraActive = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasMultipleCameras = computed(() => availableCameras.value.length > 1)

// 移动端检测
const isMobile = ref(false)
const isTouchDevice = ref(false)

// 检测移动设备
const detectMobileDevice = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// 检测是否支持原生相机
const checkNativeCameraSupport = () => {
  // 检测是否是移动设备
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // 检测是否支持capture属性
  const hasCaptureSupport = 'capture' in document.createElement('input')

  // 移动设备通常支持原生相机
  supportsNativeCamera.value = isMobileDevice && hasCaptureSupport
}

// 检查浏览器是否支持摄像头
const checkCameraSupport = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// 检查移动端浏览器兼容性
const checkMobileCompatibility = (): { compatible: boolean; reason?: string } => {
  // 检查基本支持
  if (!checkCameraSupport()) {
    return { compatible: false, reason: '浏览器不支持摄像头访问API' }
  }

  // 检查HTTPS环境
  if (location.protocol !== 'https:' &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1') {
    return { compatible: false, reason: '移动端摄像头需要HTTPS环境' }
  }

  // 检查iOS版本
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    const iosVersion = parseFloat(
      (/CPU.*OS ([0-9_]{3,4})/.exec(navigator.userAgent) || ['', ''])[1]
        .replace('_', '.')
    )
    if (iosVersion < 11) {
      return { compatible: false, reason: 'iOS 11+才支持摄像头访问' }
    }
  }

  // 检查Android版本
  const isAndroid = /Android/.test(navigator.userAgent)
  if (isAndroid) {
    const androidVersion = parseFloat(
      (/Android ([0-9\.]+)/.exec(navigator.userAgent) || ['', ''])[1]
    )
    if (androidVersion < 6) {
      return { compatible: false, reason: 'Android 6.0+才支持摄像头访问' }
    }
  }

  return { compatible: true }
}

// 获取可用摄像头列表
const getAvailableCameras = async () => {
  try {
    if (!checkCameraSupport()) {
      throw new Error('您的浏览器不支持摄像头访问功能')
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')
  } catch (error) {
    console.error('获取摄像头列表失败:', error)
    throw error
  }
}

// 启动摄像头
const startCamera = async () => {
  try {
    // 检查移动端兼容性
    const compatibility = checkMobileCompatibility()
    if (!compatibility.compatible) {
      throw new Error(compatibility.reason || '设备不兼容摄像头功能')
    }

    // 先获取摄像头列表
    await getAvailableCameras()

    // 使用专门的摄像头工具函数
    const stream = await requestCameraPermission()
    currentStream.value = stream

    if (videoRef.value) {
      // 关键修复：完全按照captureImage的成功逻辑来设置视频
      videoRef.value.srcObject = stream
      videoRef.value.muted = true
      videoRef.value.playsInline = true
      videoRef.value.setAttribute('playsinline', 'true')
      videoRef.value.setAttribute('webkit-playsinline', 'true')

      // 关键修复：直接尝试播放，不依赖事件处理器
      try {
        // 等待视频元数据加载完成
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('视频加载超时'))
          }, 5000)

          const checkReady = () => {
            if (videoRef.value && videoRef.value.readyState >= 2) { // HAVE_CURRENT_DATA
              clearTimeout(timeout)
              resolve()
            } else {
              setTimeout(checkReady, 100)
            }
          }

          checkReady()
        })

        // 直接尝试播放
        await videoRef.value.play()
        console.log('摄像头预览播放成功')

      } catch (playError) {
        console.warn('视频自动播放失败，需要用户交互:', playError)
        emit('error', '请点击视频区域开始预览')

        // 添加点击事件监听器来启动播放
        const startPlayback = async () => {
          try {
            await videoRef.value?.play()
            console.log('用户交互后视频播放成功')
          } catch (error) {
            console.warn('用户交互后视频播放仍然失败:', error)
          }
        }

        // 移除之前的事件监听器，避免重复绑定
        videoRef.value.removeEventListener('click', startPlayback)
        videoRef.value.removeEventListener('touchstart', startPlayback)

        videoRef.value.addEventListener('click', startPlayback, { once: true })
        videoRef.value.addEventListener('touchstart', startPlayback, { once: true })
      }
    }

    cameraActive.value = true
  } catch (error) {
    console.error('启动摄像头失败:', error)

    // 提供更详细的错误信息
    let errorMessageText = '无法访问摄像头'
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessageText = '摄像头访问被拒绝，请在浏览器设置中允许摄像头访问权限'
      } else if (error.name === 'NotFoundError') {
        errorMessageText = '未检测到摄像头设备'
      } else if (error.name === 'NotReadableError') {
        errorMessageText = '摄像头被其他应用占用'
      } else if (error.name === 'OverconstrainedError') {
        errorMessageText = '摄像头不支持请求的配置'
      } else if (error.name === 'NotSupportedError') {
        errorMessageText = '当前环境不支持摄像头访问，请确保使用HTTPS'
      } else {
        errorMessageText = `摄像头访问失败: ${error.message}`
      }
    } else {
      errorMessageText = '摄像头访问失败: 未知错误'
    }

    emit('error', errorMessageText)
  }
}

// 停止摄像头
const stopCamera = () => {
  if (currentStream.value) {
    currentStream.value.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    currentStream.value = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  cameraActive.value = false
}

// 切换摄像头
const switchCamera = async () => {
  if (!hasMultipleCameras.value) return

  const currentIndex = availableCameras.value.findIndex((camera: MediaDeviceInfo) => camera.deviceId === currentCameraId.value)
  const nextIndex = (currentIndex + 1) % availableCameras.value.length
  currentCameraId.value = availableCameras.value[nextIndex].deviceId

  // 先停止当前摄像头，再启动新的
  stopCamera()
  await startCamera()
}

// 拍照
const capturePhoto = async () => {
  if (!videoRef.value || isCapturing.value || !currentStream.value) return

  isCapturing.value = true

  try {
    // 使用专门的摄像头工具函数进行拍照
    const img = await captureImage(currentStream.value, videoRef.value)

    // 将图片转换为dataURL
    const canvas = document.createElement('canvas')
    canvas.width = img.width || videoRef.value.videoWidth
    canvas.height = img.height || videoRef.value.videoHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('无法获取canvas上下文')
    }

    // 绘制图片到canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 转换为dataURL并发送事件
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    emit('photo-captured', imageData)

    // 关闭摄像头
    stopCamera()
  } catch (error) {
    console.error('拍照失败:', error)
    emit('error', `拍照失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isCapturing.value = false
  }
}

// 检查全屏API支持
const checkFullscreenSupport = () => {
  const doc = document as any
  fullscreenSupported.value = !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  )
}

// 处理全屏状态变化
const handleFullscreenChange = () => {
  const doc = document as any
  isFullscreen.value = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  )
}

// 进入全屏
const enterFullscreen = async () => {
  if (!fullscreenSupported.value || !videoRef.value) {
    emit('error', '您的浏览器不支持全屏功能')
    return
  }

  try {
    const videoElement = videoRef.value as any

    // 使用不同浏览器的前缀
    if (videoElement.requestFullscreen) {
      await videoElement.requestFullscreen()
    } else if (videoElement.webkitRequestFullscreen) {
      await videoElement.webkitRequestFullscreen()
    } else if (videoElement.mozRequestFullScreen) {
      await videoElement.mozRequestFullScreen()
    } else if (videoElement.msRequestFullscreen) {
      await videoElement.msRequestFullscreen()
    }
  } catch (error) {
    console.error('进入全屏失败:', error)
    emit('error', '全屏切换失败，请重试')
  }
}

// 退出全屏
const exitFullscreen = async () => {
  if (isFullscreen.value) {
    try {
      const doc = document as any
      if (doc.exitFullscreen) {
        await doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen()
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen()
      }
    } catch (error) {
      console.error('退出全屏失败:', error)
    }
  }
}

// 处理视频点击事件
const handleVideoClick = (event: Event) => {
  event.preventDefault()
  // 在全屏模式下，点击视频可以退出全屏
  if (isFullscreen.value) {
    exitFullscreen()
  }
}

// 处理视频触摸事件（移动端）
const handleVideoTouch = (event: TouchEvent) => {
  event.preventDefault()
  // 在全屏模式下，触摸视频可以退出全屏
  if (isFullscreen.value) {
    exitFullscreen()
  }
}

// 视频加载完成处理
const onVideoLoaded = async () => {
  console.log('视频流加载完成')
  console.log('视频元素尺寸:', videoRef.value?.videoWidth, 'x', videoRef.value?.videoHeight)

  // 确保视频在移动端正确播放
  if (videoRef.value && isMobile.value) {
    try {
      // 尝试再次播放以确保视频正在运行
      await videoRef.value.play()
      console.log('移动端视频播放成功')
    } catch (e) {
      console.warn('移动端视频播放失败:', e)
    }
  }
}

// 视频错误处理
const onVideoError = (event: Event) => {
  console.error('视频加载错误:', event)
  emit('error', '视频流加载失败，请检查摄像头权限或重试')
}

// 打开原生相机
const openNativeCamera = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 处理文件输入（原生相机拍照）
const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      emit('photo-captured', imageData)
      // 关闭摄像头预览
      stopCamera()
    }
    reader.onerror = () => {
      emit('error', '读取图片失败')
    }
    reader.readAsDataURL(file)
  }

  // 清空input值，允许重复选择同一文件
  target.value = ''
}

// 监听摄像头开关状态变化
const handleCameraActiveChange = async (newValue: boolean) => {
  if (newValue && !cameraActive.value) {
    await startCamera()
  } else if (!newValue && cameraActive.value) {
    stopCamera()
  }
}

// 初始化
onMounted(() => {
  detectMobileDevice()
  checkNativeCameraSupport()
  checkFullscreenSupport()

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)

  // 如果初始状态为开启，则启动摄像头
  if (props.modelValue) {
    startCamera()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
  stopCamera()
})

// 监听props变化
watch(() => props.modelValue, handleCameraActiveChange)
</script>
