<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-sun text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- 预设选择 -->
            <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        亮度调整预设
                    </label>
                    <button @click="resetLuminance"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-4">
                    <button v-for="(preset, key) in LUMINANCE_PRESETS" :key="key"
                        class="glass-btn text-xs py-2 px-2 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex flex-col items-center gap-1"
                        :class="{ 'bg-white/20 text-white/90': currentPreset === key }"
                        @click="applyPreset(key)">
                        <div class="text-lg opacity-70">
                            <div v-if="key === 'default'" class="i-carbon-settings"></div>
                            <div v-else-if="key === 'enhanceShadows'" class="i-carbon-moon"></div>
                            <div v-else-if="key === 'enhanceHighlights'" class="i-carbon-sun"></div>
                            <div v-else-if="key === 'popColors'" class="i-carbon-palette"></div>
                            <div v-else-if="key === 'contrastBoost'" class="i-carbon-contrast"></div>
                            <div v-else-if="key === 'warmTones'" ></div>
                            <div v-else-if="key === 'coolTones'"></div>
                        </div>
                        <span>{{ preset.name }}</span>
                    </button>
                </div>
            </div>

            <!-- 阴影调整 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        阴影调整
                    </label>
                    <button @click="resetShadows"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasShadowAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="shadowSliderItems" @updateValue="handleShadowUpdate" />
            </div>

            <!-- 中间调调整 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        中间调调整
                    </label>
                    <button @click="resetMidtones"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasMidtoneAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="midtoneSliderItems" @updateValue="handleMidtoneUpdate" />
            </div>

            <!-- 高光调整 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        高光调整
                    </label>
                    <button @click="resetHighlights"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasHighlightAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="highlightSliderItems" @updateValue="handleHighlightUpdate" />
            </div>

            <!-- 范围控制 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        范围控制
                    </label>
                    <button @click="resetRanges"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasRangeAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="rangeSliderItems" @updateValue="handleRangeUpdate" />
            </div>

            <!-- 处理状态 -->
            <div v-if="isProcessing" class="flex items-center justify-center py-4">
                <div class="i-carbon-circle-dash animate-spin text-white/60 mr-2"></div>
                <span class="text-sm text-white/60">正在处理亮度调整...</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import {
    DEFAULT_LUMINANCE_PARAMS,
    LUMINANCE_PRESETS,
    type LuminanceAdjustmentParams,
    type LuminancePreset,
    validateLuminanceParams,
    createLuminanceAdjustmentEvent,
    getLuminancePreset
} from '../../utils/luminanceAdjustment'
import type { ZoneAdjustment } from '../../utils/webgpu/luminance-shaders'
import type { ControlEvent } from '../../types/controlEvents'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    luminanceParams?: LuminanceAdjustmentParams
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State
const luminanceParams = ref<LuminanceAdjustmentParams>({ ...DEFAULT_LUMINANCE_PARAMS })
const currentPreset = ref<LuminancePreset | null>(null)
const isProcessing = ref(false)

// Computed
const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile
        ? 'flex flex-col gap-3'
        : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
)

const hasAdjustments = computed(() => {
    return JSON.stringify(luminanceParams.value) !== JSON.stringify(DEFAULT_LUMINANCE_PARAMS)
})

const hasShadowAdjustments = computed(() => {
    const defaultShadows = DEFAULT_LUMINANCE_PARAMS.shadows
    const currentShadows = luminanceParams.value.shadows
    return JSON.stringify(currentShadows) !== JSON.stringify(defaultShadows)
})

const hasMidtoneAdjustments = computed(() => {
    const defaultMidtones = DEFAULT_LUMINANCE_PARAMS.midtones
    const currentMidtones = luminanceParams.value.midtones
    return JSON.stringify(currentMidtones) !== JSON.stringify(defaultMidtones)
})

const hasHighlightAdjustments = computed(() => {
    const defaultHighlights = DEFAULT_LUMINANCE_PARAMS.highlights
    const currentHighlights = luminanceParams.value.highlights
    return JSON.stringify(currentHighlights) !== JSON.stringify(defaultHighlights)
})

const hasRangeAdjustments = computed(() => {
    return luminanceParams.value.shadowEnd !== DEFAULT_LUMINANCE_PARAMS.shadowEnd ||
           luminanceParams.value.highlightStart !== DEFAULT_LUMINANCE_PARAMS.highlightStart ||
           luminanceParams.value.softness !== DEFAULT_LUMINANCE_PARAMS.softness
})

const shadowSliderItems = computed(() => [
    {
        id: 'shadow-brightness',
        label: '亮度',
        value: luminanceParams.value.shadows.brightness,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'shadow-contrast',
        label: '对比度',
        value: luminanceParams.value.shadows.contrast,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #666 0%, #fff 50%, #666 100%)',
        showRuler: true
    },
    {
        id: 'shadow-saturation',
        label: '饱和度',
        value: luminanceParams.value.shadows.saturation,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
        showRuler: true
    },
    {
        id: 'shadow-red',
        label: '红色',
        value: luminanceParams.value.shadows.red,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #ff0000 100%)',
        showRuler: false
    },
    {
        id: 'shadow-green',
        label: '绿色',
        value: luminanceParams.value.shadows.green,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #00ff00 100%)',
        showRuler: false
    },
    {
        id: 'shadow-blue',
        label: '蓝色',
        value: luminanceParams.value.shadows.blue,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #0000ff 100%)',
        showRuler: false
    }
])

const midtoneSliderItems = computed(() => [
    {
        id: 'midtone-brightness',
        label: '亮度',
        value: luminanceParams.value.midtones.brightness,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'midtone-contrast',
        label: '对比度',
        value: luminanceParams.value.midtones.contrast,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #666 0%, #fff 50%, #666 100%)',
        showRuler: true
    },
    {
        id: 'midtone-saturation',
        label: '饱和度',
        value: luminanceParams.value.midtones.saturation,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
        showRuler: true
    },
    {
        id: 'midtone-red',
        label: '红色',
        value: luminanceParams.value.midtones.red,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #ff0000 100%)',
        showRuler: false
    },
    {
        id: 'midtone-green',
        label: '绿色',
        value: luminanceParams.value.midtones.green,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #00ff00 100%)',
        showRuler: false
    },
    {
        id: 'midtone-blue',
        label: '蓝色',
        value: luminanceParams.value.midtones.blue,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #0000ff 100%)',
        showRuler: false
    }
])

const highlightSliderItems = computed(() => [
    {
        id: 'highlight-brightness',
        label: '亮度',
        value: luminanceParams.value.highlights.brightness,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'highlight-contrast',
        label: '对比度',
        value: luminanceParams.value.highlights.contrast,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #666 0%, #fff 50%, #666 100%)',
        showRuler: true
    },
    {
        id: 'highlight-saturation',
        label: '饱和度',
        value: luminanceParams.value.highlights.saturation,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
        showRuler: true
    },
    {
        id: 'highlight-red',
        label: '红色',
        value: luminanceParams.value.highlights.red,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #ff0000 100%)',
        showRuler: false
    },
    {
        id: 'highlight-green',
        label: '绿色',
        value: luminanceParams.value.highlights.green,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #00ff00 100%)',
        showRuler: false
    },
    {
        id: 'highlight-blue',
        label: '蓝色',
        value: luminanceParams.value.highlights.blue,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #0000ff 100%)',
        showRuler: false
    }
])

const rangeSliderItems = computed(() => [
    {
        id: 'shadow-end',
        label: '阴影结束',
        value: luminanceParams.value.shadowEnd,
        min: 0.1,
        max: 0.5,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 100%)',
        showRuler: true
    },
    {
        id: 'highlight-start',
        label: '高光开始',
        value: luminanceParams.value.highlightStart,
        min: 0.5,
        max: 0.9,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #888 0%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'softness',
        label: '过渡柔和度',
        value: luminanceParams.value.softness,
        min: 0.0,
        max: 0.5,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 100%)',
        showRuler: true
    }
])

// Methods
const applyPreset = (preset: LuminancePreset) => {
    currentPreset.value = preset
    luminanceParams.value = getLuminancePreset(preset)
    emitLuminanceChange()
}

const resetLuminance = () => {
    currentPreset.value = null
    luminanceParams.value = { ...DEFAULT_LUMINANCE_PARAMS }
    emitLuminanceChange()
}

const resetShadows = () => {
    luminanceParams.value.shadows = { ...DEFAULT_LUMINANCE_PARAMS.shadows }
    currentPreset.value = null
    emitLuminanceChange()
}

const resetMidtones = () => {
    luminanceParams.value.midtones = { ...DEFAULT_LUMINANCE_PARAMS.midtones }
    currentPreset.value = null
    emitLuminanceChange()
}

const resetHighlights = () => {
    luminanceParams.value.highlights = { ...DEFAULT_LUMINANCE_PARAMS.highlights }
    currentPreset.value = null
    emitLuminanceChange()
}

const resetRanges = () => {
    luminanceParams.value.shadowEnd = DEFAULT_LUMINANCE_PARAMS.shadowEnd
    luminanceParams.value.highlightStart = DEFAULT_LUMINANCE_PARAMS.highlightStart
    luminanceParams.value.softness = DEFAULT_LUMINANCE_PARAMS.softness
    currentPreset.value = null
    emitLuminanceChange()
}

const handleShadowUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<typeof luminanceParams.value.shadows> = {}
    if (data.id === 'shadow-brightness') updates.brightness = data.value
    else if (data.id === 'shadow-contrast') updates.contrast = data.value
    else if (data.id === 'shadow-saturation') updates.saturation = data.value
    else if (data.id === 'shadow-red') updates.red = data.value
    else if (data.id === 'shadow-green') updates.green = data.value
    else if (data.id === 'shadow-blue') updates.blue = data.value

    Object.assign(luminanceParams.value.shadows, updates)
    currentPreset.value = null
    emitLuminanceChange()
}

const handleMidtoneUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<typeof luminanceParams.value.midtones> = {}
    if (data.id === 'midtone-brightness') updates.brightness = data.value
    else if (data.id === 'midtone-contrast') updates.contrast = data.value
    else if (data.id === 'midtone-saturation') updates.saturation = data.value
    else if (data.id === 'midtone-red') updates.red = data.value
    else if (data.id === 'midtone-green') updates.green = data.value
    else if (data.id === 'midtone-blue') updates.blue = data.value

    Object.assign(luminanceParams.value.midtones, updates)
    currentPreset.value = null
    emitLuminanceChange()
}

const handleHighlightUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<typeof luminanceParams.value.highlights> = {}
    if (data.id === 'highlight-brightness') updates.brightness = data.value
    else if (data.id === 'highlight-contrast') updates.contrast = data.value
    else if (data.id === 'highlight-saturation') updates.saturation = data.value
    else if (data.id === 'highlight-red') updates.red = data.value
    else if (data.id === 'highlight-green') updates.green = data.value
    else if (data.id === 'highlight-blue') updates.blue = data.value

    Object.assign(luminanceParams.value.highlights, updates)
    currentPreset.value = null
    emitLuminanceChange()
}

const handleRangeUpdate = (data: { id: string; value: number }) => {
    if (data.id === 'shadow-end') luminanceParams.value.shadowEnd = data.value
    else if (data.id === 'highlight-start') luminanceParams.value.highlightStart = data.value
    else if (data.id === 'softness') luminanceParams.value.softness = data.value

    currentPreset.value = null
    emitLuminanceChange()
}

const emitLuminanceChange = () => {
    const validation = validateLuminanceParams(luminanceParams.value)
    if (!validation.isValid) {
        console.warn('亮度参数验证失败:', validation.errors)
        return
    }

    emit('controlEvent', createLuminanceAdjustmentEvent(luminanceParams.value))
}

// Watchers
watch(() => props.luminanceParams, (newParams) => {
    if (newParams) {
        luminanceParams.value = { ...newParams }
    }
}, { deep: true })

// 当图像变化时重置所有设置
watch(() => props.originalImage, () => {
    resetLuminance()
})
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>