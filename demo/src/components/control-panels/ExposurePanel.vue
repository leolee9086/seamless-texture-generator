<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-sun text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- Auto Exposure Adjustment -->
            <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        自动曝光调整
                    </label>
                    <button @click="resetAutoExposure"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasAutoExposureAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <!-- 模式选择 -->
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xs text-white/60">分析模式:</span>
                    <select v-model="autoExposureMode"
                        class="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 focus:border-white/30 outline-none">
                        <option value="cdf">CDF 色调映射</option>
                        <option value="clahe">CLAHE 自适应</option>
                    </select>
                </div>

                <!-- CDF模式参数 -->
                <div v-if="autoExposureMode === 'cdf'">
                    <Slider :items="autoExposureSliderItems" @updateValue="handleAutoExposureUpdate" />
                </div>

                <!-- CLAHE模式参数 -->
                <div v-else-if="autoExposureMode === 'clahe'">
                    <Slider :items="claheSliderItems" @updateValue="handleCLAHEUpdate" />
                </div>

                <div class="mt-3 text-xs text-white/50">
                    <p v-if="autoExposureMode === 'cdf'">CDF模式分析直方图并全局调整曝光水平。</p>
                    <p v-else-if="autoExposureMode === 'clahe'">CLAHE分块自适应均衡化，增强局部对比度。</p>
                </div>
            </div>

            <!-- Manual Exposure Adjustment -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        手动曝光调整
                    </label>
                    <button @click="resetManualExposure"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasManualExposureAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="manualExposureSliderItems" @updateValue="handleManualExposureUpdate" />

                <div class="mt-3 text-xs text-white/50">
                    <p>手动调整曝光、对比度和伽马值，精确控制图像外观。</p>
                </div>
            </div>

            <!-- Mode Toggle -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between">
                    <label class="block text-sm font-medium text-white/80">
                        调整模式
                    </label>
                    <div class="flex gap-2">
                        <button @click="exposureMode = 'auto'"
                            class="glass-btn text-[10px] px-3 py-1.5 rounded transition-colors" :class="exposureMode === 'auto'
                                ? 'bg-white/20 text-white border-white/40'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border-white/10'">
                            自动
                        </button>
                        <button @click="exposureMode = 'manual'"
                            class="glass-btn text-[10px] px-3 py-1.5 rounded transition-colors" :class="exposureMode === 'manual'
                                ? 'bg-white/20 text-white border-white/40'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border-white/10'">
                            手动
                        </button>
                    </div>
                </div>
            </div>

            <!-- Preview Toggle -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between">
                    <label class="block text-sm font-medium text-white/80">
                        显示调整预览
                    </label>
                    <button @click="togglePreview" class="glass-btn text-[10px] px-3 py-1.5 rounded transition-colors"
                        :class="showPreview
                            ? 'bg-white/20 text-white border-white/40'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border-white/10'">
                        {{ showPreview ? '开启' : '关闭' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { createUpdateDataEvent } from '../../types/controlEvents'
import type { ControlEvent } from '../../types/controlEvents'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    exposureStrength?: number
    exposureManual?: { exposure: number; contrast: number; gamma: number }
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State
const autoExposureStrength = ref(props.exposureStrength || 1.0)
const manualExposure = ref(props.exposureManual?.exposure || 1.0)
const manualContrast = ref(props.exposureManual?.contrast || 1.0)
const manualGamma = ref(props.exposureManual?.gamma || 1.0)
const exposureMode = ref<'auto' | 'manual'>('auto')
const autoExposureMode = ref<'cdf' | 'clahe'>('cdf')
const claheClipLimit = ref(2.0)
const claheBlockSize = ref(64)
const showPreview = ref(true)

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

const hasAutoExposureAdjustments = computed(() =>
    autoExposureStrength.value !== 1.0
)

const hasManualExposureAdjustments = computed(() =>
    manualExposure.value !== 1.0 || manualContrast.value !== 1.0 || manualGamma.value !== 1.0
)

const autoExposureSliderItems = computed(() => [
    {
        id: 'auto-exposure-strength',
        label: '调整强度',
        value: autoExposureStrength.value,
        min: 0,
        max: 20,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #1a1a1a 0%, #888 50%, #ffffff 100%)',
        showRuler: true
    }
])

const claheSliderItems = computed(() => [
    {
        id: 'clahe-clip-limit',
        label: '对比度限制',
        value: claheClipLimit.value,
        min: 1.0,
        max: 4.0,
        step: 0.1,
        gradient: 'linear-gradient(90deg, #333 0%, #888 50%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'clahe-block-size',
        label: '分块大小',
        value: claheBlockSize.value,
        min: 32,
        max: 128,
        step: 32,
        gradient: 'linear-gradient(90deg, #666 0%, #aaa 100%)',
        showRuler: true
    }
])

const manualExposureSliderItems = computed(() => [
    {
        id: 'manual-exposure',
        label: '曝光',
        value: manualExposure.value,
        min: 0.1,
        max: 3,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: true
    },
    {
        id: 'manual-contrast',
        label: '对比度',
        value: manualContrast.value,
        min: 0.5,
        max: 2,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #666 0%, #fff 50%, #666 100%)',
        showRuler: true
    },
    {
        id: 'manual-gamma',
        label: '伽马',
        value: manualGamma.value,
        min: 0.5,
        max: 2.2,
        step: 0.01,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: true
    }
])

// Methods
const handleAutoExposureUpdate = (data: { id: string; value: number }) => {
    if (data.id === 'auto-exposure-strength') {
        autoExposureStrength.value = data.value
        emit('controlEvent', createUpdateDataEvent('exposure-strength', data.value))
    }
}

const handleCLAHEUpdate = (data: { id: string; value: number }) => {
    if (data.id === 'clahe-clip-limit') {
        claheClipLimit.value = data.value
    } else if (data.id === 'clahe-block-size') {
        claheBlockSize.value = data.value
    }
    emit('controlEvent', createUpdateDataEvent('exposure-clahe', {
        clipLimit: claheClipLimit.value,
        blockSize: claheBlockSize.value,
        numBins: 256
    }))
}

const handleManualExposureUpdate = (data: { id: string; value: number }) => {
    if (data.id === 'manual-exposure') {
        manualExposure.value = data.value
    } else if (data.id === 'manual-contrast') {
        manualContrast.value = data.value
    } else if (data.id === 'manual-gamma') {
        manualGamma.value = data.value
    }

    emit('controlEvent', createUpdateDataEvent('exposure-manual', {
        exposure: manualExposure.value,
        contrast: manualContrast.value,
        gamma: manualGamma.value
    }))
}

const resetAutoExposure = () => {
    autoExposureStrength.value = 1.0
    emit('controlEvent', createUpdateDataEvent('exposure-strength', 1.0))
}

const resetManualExposure = () => {
    manualExposure.value = 1.0
    manualContrast.value = 1.0
    manualGamma.value = 1.0
    emit('controlEvent', createUpdateDataEvent('exposure-manual', {
        exposure: 1.0,
        contrast: 1.0,
        gamma: 1.0
    }))
}

const togglePreview = () => {
    showPreview.value = !showPreview.value
    // 这里可以添加预览切换的逻辑
}

// Watchers
watch(() => props.exposureStrength, (newVal) => {
    if (newVal !== undefined) {
        autoExposureStrength.value = newVal
        // 防止循环触发: 如果是 auto 模式，更新可能会再次触发事件?
        // 不，updateValue 事件由 slider 触发，这里只是响应 prop 变化
    }
})

watch(() => props.exposureManual, (newVal) => {
    if (newVal) {
        manualExposure.value = newVal.exposure
        manualContrast.value = newVal.contrast
        manualGamma.value = newVal.gamma
    }
}, { deep: true })

watch(exposureMode, (newMode) => {
    // 当模式切换时，发送相应的事件
    if (newMode === 'auto') {
        emit('controlEvent', createUpdateDataEvent('exposure-strength', autoExposureStrength.value))
    } else {
        emit('controlEvent', createUpdateDataEvent('exposure-manual', {
            exposure: manualExposure.value,
            contrast: manualContrast.value,
            gamma: manualGamma.value
        }))
    }
})
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>