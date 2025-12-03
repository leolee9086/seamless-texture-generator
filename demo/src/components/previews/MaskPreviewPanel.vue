<template>
    <div class="mask-preview-panel">
        <!-- Global Mask Options -->
        <div class="mask-options flex flex-col gap-2 mb-3 p-2 bg-black/20 rounded border border-white/5">
            <label class="checkbox-label flex items-center cursor-pointer text-xs text-white/80">
                <input type="checkbox" :checked="maskOptions.smooth" @change="updateMaskOptionsSmooth"
                    :disabled="processing"
                    class="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                平滑遮罩边缘
            </label>
            <label class="checkbox-label flex items-center cursor-pointer text-xs text-white/80">
                <input type="checkbox" :checked="maskOptions.invert" @change="updateMaskOptionsInvert"
                    :disabled="processing"
                    class="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                反转最终遮罩
            </label>
        </div>

        <!-- Mask Preview -->
        <div v-if="layers.length > 0 && !isMobile" class="mask-preview border-t border-white/5 pt-3">
            <h4 class="text-xs text-white/70 mb-2">蒙版预览</h4>
            <div
                class="canvas-container flex justify-center items-center bg-black/20 rounded border border-white/10 p-2">
                <canvas ref="maskPreviewCanvasRef" class="max-w-full rounded border-2 border-red-500/30"></canvas>
            </div>
            <div class="text-[10px] text-white/50 text-center mt-1">半透明红色区域 = LUT应用区域</div>

            <!-- Preview Overlay Button -->
            <div class="mt-3 flex justify-center">
                <button @click="toggleMaskPreview"
                    class="preview-btn flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                    <div :class="maskPreviewMode ? 'i-carbon-view-off' : 'i-carbon-view'" class="w-4 h-4"></div>
                    {{ maskPreviewMode ? '退出预览' : '在画布预览' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, Component, reactive } from 'vue'
import MaskPreview from './MaskPreview.vue'
import type { AdjustmentLayer } from '../../composables/useColorBlockSelector'

interface MaskOptions {
    smooth: boolean
    invert: boolean
}

interface Props {
    processing: boolean
    originalImage: string | null
    layers: AdjustmentLayer[]
    maskOptions: MaskOptions
    updateMaskPreview: (originalImage: string, canvas?: HTMLCanvasElement) => Promise<void>
    generateMaskPreviewImageDataUrl: (originalImage: string) => Promise<string | null>
    generateColorBlockMask: (originalImage: string) => Promise<Uint8Array | null>
    isMobile?: boolean
}

interface Emits {
    (e: 'update:maskOptions', options: MaskOptions): void
    (e: 'set-preview-overlay', data: any, component: Component | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Mask preview canvas ref
const maskPreviewCanvasRef = ref<HTMLCanvasElement>()

// Mask preview mode
const maskPreviewMode = ref(false)

// Reactive state for preview overlay
const previewState = reactive({
    maskData: null as Uint8Array | null,
    originalImage: null as string | null,
    activeLayerName: undefined as string | undefined,
    visibleLayerCount: 0,
    layers: [] as AdjustmentLayer[]
})

const updatePreviewState = async () => {
    if (!props.originalImage) return

    const maskData = await props.generateColorBlockMask(props.originalImage)
    if (!maskData) return

    const activeLayer = props.layers.find(l => l.visible)

    previewState.maskData = maskData
    previewState.originalImage = props.originalImage
    previewState.activeLayerName = activeLayer?.name
    previewState.visibleLayerCount = props.layers.filter(l => l.visible).length
    previewState.layers = props.layers
}

// Mask data cache is no longer used; generate fresh each time

// Watch for layers or mask options changes and update preview
watch([() => props.layers, () => props.maskOptions], async () => {
    if (props.layers.length > 0 && props.originalImage) {
        props.updateMaskPreview(props.originalImage, maskPreviewCanvasRef.value)

        if (maskPreviewMode.value) {
            await updatePreviewState()
        }
    }
}, { deep: true })

// Watch for original image changes
watch(() => props.originalImage, async (newVal) => {
    if (newVal && props.layers.length > 0) {
        props.updateMaskPreview(newVal, maskPreviewCanvasRef.value)

        if (maskPreviewMode.value) {
            await updatePreviewState()
        }
    }
})

const updateMaskOptionsSmooth = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:maskOptions', { ...props.maskOptions, smooth: target.checked })
}

const updateMaskOptionsInvert = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:maskOptions', { ...props.maskOptions, invert: target.checked })
}

// Toggle mask preview overlay
const toggleMaskPreview = async () => {
    if (maskPreviewMode.value) {
        // Exit preview
        emit('set-preview-overlay', null, null)
        maskPreviewMode.value = false
    } else {
        // Enter preview
        if (!props.originalImage) return

        await updatePreviewState()

        emit('set-preview-overlay', previewState, MaskPreview)

        maskPreviewMode.value = true
    }
}

defineExpose({
    toggleMaskPreview
})
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>