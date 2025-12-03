<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { SplitViewer } from '@leolee9086/split-viewer'
import { useI18n } from '../langs/useI18n'
import { Slider } from '@leolee9086/slider-component'
import ColorPalette from '../components/common/ColorPalette.vue'
import { type SliderItem } from '@leolee9086/slider-component'
import { WebGPUHSLProcessor } from '../Algorithm/webgpu/hsl-processor'
import { type HSLAdjustmentParams } from '../Algorithm/webgpu/hsl-shaders'
import StudioLayout from '../components/common/StudioLayout.vue'

const { t } = useI18n()

// Layout state
const layoutRef = ref<InstanceType<typeof StudioLayout> | null>(null)

// WebGPU state
const device = ref<GPUDevice | null>(null)
const processor = ref<WebGPUHSLProcessor | null>(null)
const isWebGPUSupported = ref(false)
const webgpuError = ref<string>('')

// Image state
const originalImage = ref<HTMLCanvasElement | null>(null)
const processedImage = ref<HTMLCanvasElement | null>(null)
const maskImage = ref<HTMLCanvasElement | null>(null)

// WebGPU textures
const inputTexture = ref<GPUTexture | null>(null)
const outputTexture = ref<GPUTexture | null>(null)
const maskTexture = ref<GPUTexture | null>(null)

// HSL State - 为每个颜色单独保存调整参数
interface ColorAdjustment {
    hue: number
    saturation: number
    lightness: number
    precision: number
    range: number
}

// 存储每个颜色的调整参数
const colorAdjustments = ref<Map<string, ColorAdjustment>>(new Map())

// 当前选中的颜色
const selectedColor = ref('#5856D6')

// 初始化选中颜色的调整参数
const initColorAdjustment = (color: string) => {
    if (!colorAdjustments.value.has(color)) {
        colorAdjustments.value.set(color, {
            hue: 0,
            saturation: 0,
            lightness: 0,
            precision: 30,
            range: 50
        })
    }
}

// 初始化默认颜色
initColorAdjustment(selectedColor.value)

// View mode: 'split' | 'mask'
type ViewMode = 'split' | 'mask'
const viewMode = ref<ViewMode>('split')

// 使用computed让sliderItems自动反映当前颜色的调整值
const sliderItems = computed<SliderItem[]>(() => {
    // 确保从colorAdjustments中获取当前颜色的最新值
    const currentAdjustment = colorAdjustments.value.get(selectedColor.value)
    const currentHue = currentAdjustment?.hue ?? 0
    const currentSaturation = currentAdjustment?.saturation ?? 0
    const currentLightness = currentAdjustment?.lightness ?? 0
    const currentPrecision = currentAdjustment?.precision ?? 30
    const currentRange = currentAdjustment?.range ?? 50

    return [
        {
            id: 'hue',
            label: t.value.调整方法名.色相,
            value: currentHue,
            min: -180,
            max: 180,
            gradient: 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            showRuler: false
        },
        {
            id: 'saturation',
            label: t.value.调整方法名.饱和度,
            value: currentSaturation,
            min: -100,
            max: 100,
            gradient: `linear-gradient(90deg, #888 0%, ${selectedColor.value} 100%)`,
            showRuler: false
        },
        {
            id: 'lightness',
            label: t.value.明度,
            value: currentLightness,
            min: -100,
            max: 100,
            gradient: `linear-gradient(90deg, #000 0%, ${selectedColor.value} 50%, #fff 100%)`,
            showRuler: false
        },
        {
            id: 'precision',
            label: t.value.精确度,
            value: currentPrecision,
            min: 0,
            max: 100,
            gradient: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #4cd964 100%)',
            showRuler: true
        },
        {
            id: 'range',
            label: t.value.范围,
            value: currentRange,
            min: 0,
            max: 100,
            gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 50%, #ffffff 100%)',
            showRuler: true
        }
    ]
})

// 初始化WebGPU
const initWebGPU = async () => {
    try {
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported')
        }

        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
            throw new Error('No GPU adapter found')
        }

        // 检查适配器限制
        const limits = adapter.limits
        const maxWorkgroupSize = limits.maxComputeWorkgroupSizeX || 16

        // 请求设备，如果支持更大的工作组则请求更高限制
        const deviceDescriptor: GPUDeviceDescriptor = {}
        if (maxWorkgroupSize >= 32) {
            deviceDescriptor.requiredLimits = {
                maxComputeInvocationsPerWorkgroup: 1024
            }
        }
        const gpuDevice = await adapter.requestDevice(deviceDescriptor)
        device.value = gpuDevice

        // 根据支持的工作组大小选择处理器模式
        const useHighPerformance = maxWorkgroupSize >= 32
        processor.value = new WebGPUHSLProcessor(gpuDevice, useHighPerformance)
        isWebGPUSupported.value = true
    } catch (error) {
        console.error('WebGPU initialization failed:', error)
        webgpuError.value = error instanceof Error ? error.message : 'Unknown error'
        isWebGPUSupported.value = false
    }
}

// 创建WebGPU纹理
const createTextures = () => {
    if (!device.value || !originalImage.value) return

    const textureDescriptor: GPUTextureDescriptor = {
        size: { width: 800, height: 600 },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
        label: 'HSL Input Texture'
    }

    const outputTextureDescriptor: GPUTextureDescriptor = {
        size: { width: 800, height: 600 },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
        label: 'HSL Output Texture'
    }

    inputTexture.value = device.value.createTexture(textureDescriptor)
    outputTexture.value = device.value.createTexture(outputTextureDescriptor)
    maskTexture.value = device.value.createTexture({
        ...outputTextureDescriptor,
        label: 'HSL Mask Texture'
    })

    // 上传原始图像到GPU
    const ctx = originalImage.value.getContext('2d')
    if (ctx) {
        const imageData = ctx.getImageData(0, 0, 800, 600)
        // 计算对齐的bytesPerRow (必须是256的倍数)
        const alignment = 256
        const bytesPerRow = 800 * 4
        const alignedBytesPerRow = Math.ceil(bytesPerRow / alignment) * alignment

        // 创建对齐的数据缓冲区
        const alignedData = new Uint8Array(alignedBytesPerRow * 600)
        for (let y = 0; y < 600; y++) {
            for (let x = 0; x < 800; x++) {
                const srcIndex = y * bytesPerRow + x * 4
                const dstIndex = y * alignedBytesPerRow + x * 4
                alignedData[dstIndex] = imageData.data[srcIndex] ?? 0
                alignedData[dstIndex + 1] = imageData.data[srcIndex + 1] ?? 0
                alignedData[dstIndex + 2] = imageData.data[srcIndex + 2] ?? 0
                alignedData[dstIndex + 3] = imageData.data[srcIndex + 3] ?? 255
            }
        }

        device.value.queue.writeTexture(
            { texture: inputTexture.value },
            alignedData,
            {
                offset: 0,
                bytesPerRow: alignedBytesPerRow,
                rowsPerImage: 600
            },
            { width: 800, height: 600 }
        )
    }
}

// 从GPU纹理读取数据到Canvas
const readTextureToCanvas = async (texture: GPUTexture, canvas: HTMLCanvasElement) => {
    if (!device.value) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 计算对齐的bytesPerRow (必须是256的倍数)
    const alignment = 256
    const bytesPerRow = 800 * 4
    const alignedBytesPerRow = Math.ceil(bytesPerRow / alignment) * alignment

    // 创建临时缓冲区用于读取
    const readBuffer = device.value.createBuffer({
        size: alignedBytesPerRow * 600,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        label: 'HSL Read Buffer'
    })

    // 复制纹理到缓冲区
    const commandEncoder = device.value.createCommandEncoder({ label: 'HSL Read Command Encoder' })
    commandEncoder.copyTextureToBuffer(
        { texture: texture },
        {
            buffer: readBuffer,
            offset: 0,
            bytesPerRow: alignedBytesPerRow,
            rowsPerImage: 600
        },
        { width: 800, height: 600 }
    )

    device.value.queue.submit([commandEncoder.finish()])

    // 读取缓冲区数据
    await readBuffer.mapAsync(GPUMapMode.READ)
    const arrayBuffer = readBuffer.getMappedRange()
    // 需要从对齐的行中提取实际数据
    const actualData = new Uint8ClampedArray(800 * 600 * 4)
    const srcData = new Uint8Array(arrayBuffer)

    for (let y = 0; y < 600; y++) {
        for (let x = 0; x < 800; x++) {
            const srcIndex = y * alignedBytesPerRow + x * 4
            const dstIndex = y * 800 * 4 + x * 4
            actualData[dstIndex] = srcData[srcIndex] ?? 0
            actualData[dstIndex + 1] = srcData[srcIndex + 1] ?? 0
            actualData[dstIndex + 2] = srcData[srcIndex + 2] ?? 0
            actualData[dstIndex + 3] = srcData[srcIndex + 3] ?? 255
        }
    }

    const imageData = new ImageData(actualData, 800, 600)
    ctx.putImageData(imageData, 0, 0)
    readBuffer.unmap()
    readBuffer.destroy()
}

const handleSliderUpdate = (payload: { id: string; value: number }) => {
    // 直接更新colorAdjustments中当前颜色的对应参数
    const currentAdjustment = colorAdjustments.value.get(selectedColor.value)
    if (currentAdjustment) {
        if (payload.id === 'hue') currentAdjustment.hue = payload.value
        else if (payload.id === 'saturation') currentAdjustment.saturation = payload.value
        else if (payload.id === 'lightness') currentAdjustment.lightness = payload.value
        else if (payload.id === 'precision') currentAdjustment.precision = payload.value
        else if (payload.id === 'range') currentAdjustment.range = payload.value
    }

    processImage()
}

const handleColorSelect = (color: string) => {
    // 切换到新颜色
    selectedColor.value = color

    // 确保新颜色有初始化的参数

    // 重新初始化当前颜色
    //    colorAdjustments.value.clear()

    // 重新初始化当前颜色
    initColorAdjustment(selectedColor.value)

    processImage()
}

const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
}

const resetAdjustments = () => {
    // 清空所有颜色的调整
    colorAdjustments.value.clear()

    // 重新初始化当前颜色
    initColorAdjustment(selectedColor.value)

    processImage()
}

const processImage = async () => {
    if (!processor.value || !inputTexture.value || !outputTexture.value || !maskTexture.value) return

    try {
        // 创建输出canvas
        const processedCanvas = document.createElement('canvas')
        processedCanvas.width = 800
        processedCanvas.height = 600

        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = 800
        maskCanvas.height = 600

        // 依次应用所有颜色的调整（叠加效果）
        let currentInputTexture = inputTexture.value
        let tempTexture1 = device.value!.createTexture({
            size: { width: 800, height: 600 },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
            label: 'HSL Temp Texture 1'
        })
        let tempTexture2 = device.value!.createTexture({
            size: { width: 800, height: 600 },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
            label: 'HSL Temp Texture 2'
        })

        let useTemp1 = true

        // 注意：由于我们复用同一个UniformBuffer，必须在每次处理后立即提交命令
        // 否则queue.writeBuffer会在所有命令编码后才统一执行（或覆盖），导致所有pass使用最后一次的参数

        for (const [color, adj] of colorAdjustments.value) {
            // 只处理有实际调整的颜色（跳过默认值）
            if (adj.hue !== 0 || adj.saturation !== 0 || adj.lightness !== 0) {
                const params: HSLAdjustmentParams = {
                    targetColor: color,
                    hueOffset: adj.hue,
                    saturationOffset: adj.saturation,
                    lightnessOffset: adj.lightness,
                    precision: adj.precision,
                    range: adj.range,
                    maskMode: 'adjust'
                }

                const commandEncoder = device.value!.createCommandEncoder({ label: `HSL Process Encoder ${color}` })

                // 交替使用临时纹理避免冲突
                const outputTexture = useTemp1 ? tempTexture1 : tempTexture2

                processor.value!.processImage(
                    currentInputTexture,
                    outputTexture,
                    params,
                    commandEncoder
                )

                // 立即提交当前颜色的处理
                device.value!.queue.submit([commandEncoder.finish()])

                // 交换纹理引用
                currentInputTexture = outputTexture
                useTemp1 = !useTemp1
            }
        }

        // 生成当前选中颜色的遮罩
        const currentAdj = colorAdjustments.value.get(selectedColor.value)
        if (currentAdj) {
            const maskParams: HSLAdjustmentParams = {
                targetColor: selectedColor.value,
                hueOffset: 0,
                saturationOffset: 0,
                lightnessOffset: 0,
                precision: currentAdj.precision,
                range: currentAdj.range,
                maskMode: 'overlay',
                overlayColor: [1.0, 0.0, 0.0], // 红色叠加
                overlayAlpha: 0.6
            }

            const maskEncoder = device.value!.createCommandEncoder({ label: 'HSL Mask Encoder' })
            processor.value!.generateMaskOverlay(
                inputTexture.value,
                maskTexture.value!,
                selectedColor.value,
                currentAdj.precision,
                currentAdj.range,
                [1.0, 0.0, 0.0],
                0.6,
                maskEncoder
            )
            device.value!.queue.submit([maskEncoder.finish()])
        }

        // 读取结果到canvas
        await readTextureToCanvas(currentInputTexture, processedCanvas)
        processedImage.value = processedCanvas

        await readTextureToCanvas(maskTexture.value!, maskCanvas)
        maskImage.value = maskCanvas

        // 清理临时纹理
        tempTexture1.destroy()
        tempTexture2.destroy()

    } catch (error) {
        console.error('Image processing failed:', error)
        webgpuError.value = error instanceof Error ? error.message : 'Processing error'
    }
}

const createOriginalImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
        ctx.drawImage(img, 0, 0, 800, 600)
        originalImage.value = canvas

        // WebGPU初始化和纹理创建
        if (isWebGPUSupported.value) {
            createTextures()
            await processImage()
        }
    }
    img.src = 'https://picsum.photos/id/1016/800/600'
}

onMounted(async () => {
    // 初始化WebGPU
    await initWebGPU()

    // 创建原始图像
    createOriginalImage()
})

onUnmounted(() => {
    // 清理WebGPU资源
    if (processor.value) {
        processor.value.destroy()
    }
    if (inputTexture.value) inputTexture.value.destroy()
    if (outputTexture.value) outputTexture.value.destroy()
    if (maskTexture.value) maskTexture.value.destroy()
})
</script>

<template>
    <StudioLayout
        ref="layoutRef"
        :title="t.HSL功能 + ' (WebGPU)'"
        titleIcon="🚀"
        :showResetButton="true"
        :resetButtonText="t.重置"
        :error="!isWebGPUSupported"
        :errorText="webgpuError || '您的浏览器不支持WebGPU，请使用支持WebGPU的现代浏览器。'"
        :loading="!isWebGPUSupported || !originalImage || !processedImage || !maskImage"
        :loadingText="isWebGPUSupported ? t.加载资源 : '初始化WebGPU...'"
        :rightLabel="viewMode === 'split' ? t.已处理 + ' (WebGPU)' : t.调整范围蒙版 + ' (WebGPU)'"
        @reset="resetAdjustments"
    >
        <template #beforeHeader>
            <!-- WebGPU状态指示器 -->
            <div class="webgpu-status">
                <div class="status-indicator" :class="{ active: isWebGPUSupported }"></div>
                <span>WebGPU {{ isWebGPUSupported ? '已启用' : '不可用' }}</span>
            </div>
        </template>

        <template #viewer="{ width, height }">
            <!-- Split View: Original vs Processed -->
            <SplitViewer
                v-if="viewMode === 'split'"
                :leftImage="originalImage"
                :rightImage="processedImage"
                :width="width"
                :height="height"
                :splitPosition="0.5"
            />

            <!-- Mask View: Original vs Mask Overlay -->
            <SplitViewer
                v-else-if="viewMode === 'mask'"
                :leftImage="originalImage"
                :rightImage="maskImage"
                :width="width"
                :height="height"
                :splitPosition="0.5"
            />
        </template>

        <template #controls>
            <!-- View Mode Switcher -->
            <div class="control-label">{{ t.视图模式 }}</div>
            <div class="view-mode-buttons">
                <button class="view-mode-btn" :class="{ active: viewMode === 'split' }"
                    @click="setViewMode('split')">
                    {{ t.裂像预览 }}
                </button>
                <button class="view-mode-btn" :class="{ active: viewMode === 'mask' }"
                    @click="setViewMode('mask')">
                    {{ t.调整范围蒙版 }}
                </button>
            </div>

            <!-- Color Picker -->
            <div class="control-label">{{ t.调整 }}</div>
            <ColorPalette v-model="selectedColor" @change="handleColorSelect" />

            <!-- Sliders -->
            <Slider :items="sliderItems" @updateValue="handleSliderUpdate" />
        </template>

        <template #info>
            <h3>{{ t.快速提示.提示1.split(' ')[0] }}</h3>
            <ul>
                <li>{{ t.快速提示.提示1 }}</li>
                <li>{{ t.快速提示.提示2 }}</li>
                <li>🚀 使用WebGPU加速处理，性能大幅提升</li>
            </ul>
        </template>
    </StudioLayout>
</template>

<style scoped>
.title-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-group h2 {
    margin: 0;
}

.icon {
    font-size: 20px;
}

.view-mode-buttons {
    display: flex;
    gap: 6px;
    width: 100%;
}

.view-mode-btn {
    flex: 1;
    padding: 8px 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.view-mode-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
}

.view-mode-btn.active {
    background: var(--accent-color, #0a84ff);
    border-color: var(--accent-color, #0a84ff);
    color: #fff;
}

.webgpu-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    font-size: 12px;
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff3b30;
    transition: background 0.3s;
}

.status-indicator.active {
    background: #4cd964;
}

.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
}

.error-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.error-state h3 {
    margin: 0 0 8px 0;
    color: #ff3b30;
}

.error-state p {
    margin: 0;
    max-width: 400px;
    line-height: 1.5;
}
</style>