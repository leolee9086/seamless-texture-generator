<template>
  <div class="mask-preview-container w-full h-full flex flex-col bg-darkglass-100 rounded-xl overflow-hidden">
    <div class="preview-header p-4 border-b border-white/5 bg-black/20">
      <h3 class="text-lg font-semibold text-white/90 mb-1">蒙版预览</h3>
      <div class="layer-info flex gap-4 text-sm text-white/60">
        <span>当前图层: {{ activeLayerName || '无' }}</span>
        <span>可见图层: {{ visibleLayerCount }}</span>
      </div>
    </div>
    
    <div ref="previewContent" class="preview-content flex-1 flex items-center justify-center p-4">
      <canvas ref="maskCanvas" class="rounded border-2 border-red-500/30"></canvas>
    </div>
    
    <div class="preview-legend p-4 border-t border-white/5 bg-black/20">
      <div class="legend-item flex items-center gap-2 mb-2">
        <div class="color-box w-4 h-4 rounded bg-red-500/80 border border-red-300"></div>
        <span class="text-sm text-white/80">LUT应用区域</span>
      </div>
      <div class="legend-item flex items-center gap-2">
        <div class="color-box w-4 h-4 rounded bg-transparent border border-white/40"></div>
        <span class="text-sm text-white/80">不应用LUT</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { 将ImageData绘制到Canvas } from '../../utils/lut/canvas/draw'
import { createMaskPreviewData } from '../../utils/lut/imageProcessor'

interface Props {
  maskPreviewImage?: string  // 保留向后兼容
  maskData?: Uint8Array  // 直接的蒙版数据
  originalImage?: string  // 原始图像URL
  activeLayerName?: string
  visibleLayerCount?: number
  layers?: any[]
}

const props = defineProps<Props>()
const maskCanvas = ref<HTMLCanvasElement>()
const previewContent = ref<HTMLElement>()

// 渲染蒙版到画布
const renderMask = async () => {
  if (!maskCanvas.value || !props.originalImage) return
  
  // 等待DOM更新完成，确保容器尺寸已计算
  await nextTick()
  
  const canvas = maskCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 加载原始图像
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图像加载失败'))
    img.src = props.originalImage!
  })
  
  // 获取容器的实际尺寸
  const container = previewContent.value
  if (!container) return
  
  const containerRect = container.getBoundingClientRect()
  const containerWidth = containerRect.width - 32 // 减去padding
  const containerHeight = containerRect.height - 32 // 减去padding
  
  // 计算画布尺寸，保持图像比例并填满容器
  const imgAspectRatio = img.width / img.height
  const containerAspectRatio = containerWidth / containerHeight
  
  let canvasWidth, canvasHeight
  if (imgAspectRatio > containerAspectRatio) {
    // 图像更宽，以容器宽度为准
    canvasWidth = containerWidth
    canvasHeight = containerWidth / imgAspectRatio
  } else {
    // 图像更高，以容器高度为准
    canvasHeight = containerHeight
    canvasWidth = containerHeight * imgAspectRatio
  }
  
  // 确保画布尺寸至少为1像素，避免0尺寸导致的渲染问题
  canvasWidth = Math.max(1, Math.floor(canvasWidth))
  canvasHeight = Math.max(1, Math.floor(canvasHeight))
  
  // 设置画布实际显示尺寸和内部尺寸
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制原始图像作为底图
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  
  // 如果有蒙版数据，绘制蒙版覆盖层
  if (props.maskData) {
    try {
      const maskImageData = createMaskPreviewData(props.maskData, img, canvasWidth, canvasHeight)
      
      // 使用与MaskPreviewPanel.vue相同的绘制方式
      将ImageData绘制到Canvas(maskImageData, canvas, 'source-over')
    } catch (error) {
      console.error('创建蒙版预览数据失败:', error)
    }
  } else if (props.maskPreviewImage) {
    // 向后兼容：使用 dataURL
    const maskImg = new Image()
    maskImg.onload = () => {
      ctx.drawImage(maskImg, 0, 0, canvasWidth, canvasHeight)
    }
    maskImg.src = props.maskPreviewImage
  }
}

// 监听数据变化
watch([() => props.maskData, () => props.originalImage], renderMask, { deep: true })

onMounted(renderMask)
</script>

<style scoped>
.mask-preview-container {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
</style>