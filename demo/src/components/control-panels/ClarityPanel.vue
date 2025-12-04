<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-color-palette text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- 滤波参数组 -->
            <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        滤波参数
                    </label>
                </div>

                <div class="space-y-3">
                    <!-- Sigma (滤波强度) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">滤波强度</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'sigma',
                                label: 'Sigma',
                                value: clarityParams.sigma,
                                min: 1.0,
                                max: 16.0,
                                step: 0.5,
                                gradient: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                                showRuler: false
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.sigma.toFixed(1) }}</span>
                    </div>

                    <!-- Epsilon (正则化参数) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">正则化</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'epsilon',
                                label: 'Epsilon',
                                value: clarityParams.epsilon,
                                min: 0.01,
                                max: 0.1,
                                step: 0.01,
                                gradient: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                                showRuler: false
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.epsilon.toFixed(3) }}</span>
                    </div>

                    <!-- Radius (窗口半径) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">窗口半径</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'radius',
                                label: 'Radius',
                                value: clarityParams.radius,
                                min: 4,
                                max: 32,
                                step: 2,
                                gradient: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
                                showRuler: true
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.radius }}</span>
                    </div>

                    <!-- Block Size (线程组大小) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">线程组</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'blockSize',
                                label: 'Block Size',
                                value: clarityParams.blockSize,
                                min: 8,
                                max: 32,
                                step: 8,
                                gradient: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
                                showRuler: true
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.blockSize }}</span>
                    </div>
                </div>
            </div>

            <!-- 增强参数组 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        增强参数
                    </label>
                </div>

                <div class="space-y-3">
                    <!-- Detail Strength (细节强度) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">细节强度</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'detailStrength',
                                label: 'Detail Strength',
                                value: clarityParams.detailStrength,
                                min: 0.1,
                                max: 20.0,
                                step: 0.1,
                                gradient: 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                                showRuler: false
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.detailStrength.toFixed(1) }}</span>
                    </div>

                    <!-- Enhancement Strength (增强强度) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">增强强度</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'enhancementStrength',
                                label: 'Enhancement Strength',
                                value: clarityParams.enhancementStrength,
                                min: 0.1,
                                max: 10.0,
                                step: 0.1,
                                gradient: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                                showRuler: false
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.enhancementStrength.toFixed(1) }}</span>
                    </div>

                    <!-- Macro Enhancement (宏观增强) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">宏观增强</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'macroEnhancement',
                                label: 'Macro Enhancement',
                                value: clarityParams.macroEnhancement,
                                min: 0.0,
                                max: 2.0,
                                step: 0.1,
                                gradient: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
                                showRuler: false
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.macroEnhancement.toFixed(1) }}</span>
                    </div>

                    <!-- Contrast Boost (对比度增强) -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 w-20">对比度</label>
                        <div class="flex-1">
                            <Slider :items="[{
                                id: 'contrastBoost',
                                label: 'Contrast Boost',
                                value: clarityParams.contrastBoost,
                                min: 1.0,
                                max: 3.0,
                                step: 0.1,
                                gradient: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                                showRuler: false
                            }]" @updateValue="handleParamUpdate" />
                        </div>
                        <span class="text-xs text-white/60 w-12 text-right">{{ clarityParams.contrastBoost.toFixed(1) }}</span>
                    </div>
                </div>
            </div>

            <!-- 预设和操作 -->
            <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        预设和操作
                    </label>
                    <button @click="resetParams"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <!-- 预设按钮 -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <button v-for="(preset, key) in CLARITY_PRESETS" :key="key"
                        @click="applyPreset(key as keyof typeof CLARITY_PRESETS)"
                        class="glass-btn text-xs py-2 rounded transition-colors"
                        :class="currentPreset === key ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'">
                        {{ preset.name }}
                    </button>
                </div>

                <!-- 参数导出/导入 -->
                <div class="flex gap-2">
                    <button @click="exportParams"
                        class="glass-btn text-xs py-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors flex-1">
                        导出参数
                    </button>
                    <button @click="importParams"
                        class="glass-btn text-xs py-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors flex-1">
                        导入参数
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import type { ClarityParams } from '../../utils/clarityAdjustment'
import { DEFAULT_CLARITY_PARAMS, CLARITY_PRESETS, getClarityPreset, createClarityAdjustmentEvent } from '../../utils/clarityAdjustment'
import type { ControlEvent } from '../../types/controlEvents'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State
const clarityParams = ref<ClarityParams>({ ...DEFAULT_CLARITY_PARAMS })
const currentPreset = ref<string | null>(null)

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

// Methods
const handleParamUpdate = (data: { id: string; value: number }) => {
    const updates: Partial<ClarityParams> = {}
    updates[data.id as keyof ClarityParams] = data.value
    Object.assign(clarityParams.value, updates)
    
    // 清除当前预设
    currentPreset.value = null
    
    // 发送更新事件
    emit('controlEvent', createClarityAdjustmentEvent(clarityParams.value))
}

const resetParams = () => {
    clarityParams.value = { ...DEFAULT_CLARITY_PARAMS }
    currentPreset.value = null
    emit('controlEvent', createClarityAdjustmentEvent(clarityParams.value))
}

const applyPreset = (presetKey: keyof typeof CLARITY_PRESETS) => {
    clarityParams.value = { ...getClarityPreset(presetKey) }
    currentPreset.value = presetKey
    emit('controlEvent', createClarityAdjustmentEvent(clarityParams.value))
}

const exportParams = () => {
    const paramsData = JSON.stringify(clarityParams.value, null, 2)
    const blob = new Blob([paramsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clarity-params-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const importParams = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const importedParams = JSON.parse(e.target?.result as string)
                    clarityParams.value = { ...DEFAULT_CLARITY_PARAMS, ...importedParams }
                    currentPreset.value = null
                    emit('controlEvent', createClarityAdjustmentEvent(clarityParams.value))
                } catch (error) {
                    console.error('导入参数失败:', error)
                    alert('导入参数失败，请检查文件格式')
                }
            }
            reader.readAsText(file)
        }
    }
    input.click()
}
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>