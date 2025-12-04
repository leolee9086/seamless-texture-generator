<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-fog text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- 预设选择 -->
            <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        去雾预设
                    </label>
                    <button @click="resetDehaze"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-4">
                    <button v-for="(preset, key) in DEHAZE_PRESETS" :key="key"
                        class="glass-btn text-xs py-2 px-2 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex flex-col items-center gap-1"
                        :class="{ 'bg-white/20 text-white/90': currentPreset === key }"
                        @click="applyPreset(key)">
                        <div class="text-lg opacity-70">
                            <div v-if="key === 'light'" class="i-carbon-sun"></div>
                            <div v-else-if="key === 'medium'" class="i-carbon-cloud"></div>
                            <div v-else-if="key === 'heavy'" class="i-carbon-fog"></div>
                            <div v-else-if="key === 'adaptive'" class="i-carbon-settings-adjust"></div>
                            <div v-else-if="key === 'spatialAdaptive'" class="i-carbon-layers"></div>
                            <div v-else-if="key === 'enhanced'" class="i-carbon-contrast"></div>
                        </div>
                        <span>{{ getPresetName(key) }}</span>
                    </button>
                </div>
            </div>

            <!-- 基础参数 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        基础参数
                    </label>
                </div>

                <Slider :items="basicSliderItems" @updateValue="handleBasicSliderUpdate" />
            </div>

            <!-- 高级参数 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        高级参数
                    </label>
                    <button @click="showAdvanced = !showAdvanced"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1">
                        <div class="i-carbon-chevron-down text-sm transition-transform"
                            :class="{ 'rotate-180': showAdvanced }">
                        </div>
                        <span>{{ showAdvanced ? '收起' : '展开' }}</span>
                    </button>
                </div>

                <div v-if="showAdvanced" class="space-y-4">
                    <Slider :items="advancedSliderItems" @updateValue="handleAdvancedSliderUpdate" />
                    
                    <!-- 自适应选项 -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="text-xs text-white/70">自适应模式</label>
                            <input type="checkbox" v-model="dehazeParams.adaptiveMode"
                                class="w-4 h-4 rounded border-white/20 bg-white/10 text-white/60 focus:ring-white/20">
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <label class="text-xs text-white/70">空间自适应</label>
                            <input type="checkbox" v-model="dehazeParams.spatialAdaptiveMode"
                                :disabled="!dehazeParams.adaptiveMode"
                                class="w-4 h-4 rounded border-white/20 bg-white/10 text-white/60 focus:ring-white/20">
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <label class="text-xs text-white/70">增强功能</label>
                            <input type="checkbox" v-model="dehazeParams.enableEnhancement"
                                class="w-4 h-4 rounded border-white/20 bg-white/10 text-white/60 focus:ring-white/20">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 增强参数 -->
            <div v-if="dehazeParams.enableEnhancement" class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        增强参数
                    </label>
                </div>

                <Slider :items="enhancementSliderItems" @updateValue="handleEnhancementSliderUpdate" />
            </div>

            <!-- 处理状态 -->
            <div v-if="isProcessing" class="flex items-center justify-center py-4">
                <div class="i-carbon-circle-dash animate-spin text-white/60 mr-2"></div>
                <span class="text-sm text-white/60">正在处理去雾...</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { 
    DEFAULT_DEHAZE_PARAMS, 
    DEHAZE_PRESETS, 
    type DehazeParams, 
    type DehazePreset,
    applyDehazeAdjustment,
    getDehazePreset,
    validateDehazeParams
} from '../../utils/dehazeAdjustment'
import { createUpdateDataEvent } from '../../types/controlEvents'
import type { ControlEvent } from '../../types/controlEvents'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State
const dehazeParams = ref<DehazeParams>({ ...DEFAULT_DEHAZE_PARAMS })
const currentPreset = ref<DehazePreset | null>(null)
const showAdvanced = ref(false)
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
    return JSON.stringify(dehazeParams.value) !== JSON.stringify(DEFAULT_DEHAZE_PARAMS)
})

const basicSliderItems = computed(() => [
    {
        id: 'omega',
        label: '去雾强度',
        value: dehazeParams.value.omega,
        min: 0.1,
        max: 0.99,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 50%, #ffffff 100%)',
        showRuler: true
    },
    {
        id: 't0',
        label: '透射率阈值',
        value: dehazeParams.value.t0,
        min: 0.01,
        max: 0.3,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #4cd964 100%)',
        showRuler: true
    },
    {
        id: 'windowSize',
        label: '窗口大小',
        value: dehazeParams.value.windowSize,
        min: 0,
        max: 31,
        step: 1,
        gradient: 'linear-gradient(90deg, #5856d6 0%, #af52de 100%)',
        showRuler: true
    }
])

const advancedSliderItems = computed(() => [
    {
        id: 'topRatio',
        label: '大气光比例',
        value: dehazeParams.value.topRatio,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #ff9500 0%, #ffcc00 100%)',
        showRuler: true
    },
    {
        id: 'adaptiveStrength',
        label: '自适应强度',
        value: dehazeParams.value.adaptiveStrength,
        min: 0.1,
        max: 2.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #34c759 0%, #30d158 100%)',
        showRuler: true
    },
    {
        id: 'hazeWeight',
        label: '雾强度权重',
        value: dehazeParams.value.hazeWeight,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 100%)',
        showRuler: true
    },
    {
        id: 'atmosphericWeight',
        label: '大气光权重',
        value: dehazeParams.value.atmosphericWeight,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #ff2d55 0%, #ff3b30 100%)',
        showRuler: true
    }
])

const enhancementSliderItems = computed(() => [
    {
        id: 'saturationEnhancement',
        label: '饱和度增强',
        value: dehazeParams.value.saturationEnhancement,
        min: 0.0,
        max: 2.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
        showRuler: true
    },
    {
        id: 'contrastEnhancement',
        label: '对比度增强',
        value: dehazeParams.value.contrastEnhancement,
        min: 0.5,
        max: 2.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'brightnessEnhancement',
        label: '明度增强',
        value: dehazeParams.value.brightnessEnhancement,
        min: 0.5,
        max: 2.0,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: true
    }
])

// Methods
const getPresetName = (preset: DehazePreset): string => {
    const names = {
        light: '轻度',
        medium: '中度',
        heavy: '重度',
        adaptive: '自适应',
        spatialAdaptive: '空间自适应',
        enhanced: '增强'
    }
    return names[preset]
}

const applyPreset = (preset: DehazePreset) => {
    currentPreset.value = preset
    dehazeParams.value = getDehazePreset(preset)
    emitDehazeChange()
}

const resetDehaze = () => {
    currentPreset.value = null
    dehazeParams.value = { ...DEFAULT_DEHAZE_PARAMS }
    emitDehazeChange()
}

const handleBasicSliderUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<DehazeParams> = {}
    if (data.id === 'omega') updates.omega = data.value
    else if (data.id === 't0') updates.t0 = data.value
    else if (data.id === 'windowSize') updates.windowSize = Math.round(data.value / 2) * 2 + 1 // 确保为奇数

    Object.assign(dehazeParams.value, updates)
    currentPreset.value = null
    emitDehazeChange()
}

const handleAdvancedSliderUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<DehazeParams> = {}
    if (data.id === 'topRatio') updates.topRatio = data.value
    else if (data.id === 'adaptiveStrength') updates.adaptiveStrength = data.value
    else if (data.id === 'hazeWeight') updates.hazeWeight = data.value
    else if (data.id === 'atmosphericWeight') updates.atmosphericWeight = data.value

    Object.assign(dehazeParams.value, updates)
    currentPreset.value = null
    emitDehazeChange()
}

const handleEnhancementSliderUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<DehazeParams> = {}
    if (data.id === 'saturationEnhancement') updates.saturationEnhancement = data.value
    else if (data.id === 'contrastEnhancement') updates.contrastEnhancement = data.value
    else if (data.id === 'brightnessEnhancement') updates.brightnessEnhancement = data.value

    Object.assign(dehazeParams.value, updates)
    currentPreset.value = null
    emitDehazeChange()
}

const emitDehazeChange = () => {
    const validation = validateDehazeParams(dehazeParams.value)
    if (!validation.isValid) {
        console.warn('去雾参数验证失败:', validation.errors)
        return
    }

    emit('controlEvent', createUpdateDataEvent('dehaze-change', { ...dehazeParams.value }))
}

// Watchers
watch(() => dehazeParams.value.adaptiveMode, (newValue) => {
    if (!newValue) {
        dehazeParams.value.spatialAdaptiveMode = false
    }
})

watch(() => dehazeParams.value.spatialAdaptiveMode, (newValue) => {
    if (newValue) {
        dehazeParams.value.adaptiveMode = true
    }
})
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>