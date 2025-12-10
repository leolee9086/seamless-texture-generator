<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass(isMobile)">
            <div class="i-carbon-fog text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass(isMobile)">
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
                        :class="{ 'bg-white/20 text-white/90': currentPreset === key }" @click="applyPreset(key)">
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
            <div v-if="dehazeParams.enableEnhancement" class="border-t border-white/5 pt-3 pb-3"
                :class="{ 'px-4': !isMobile }">
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
import { Slider } from '@leolee9086/slider-component'
import { useDehazePanel } from './useDehazePanel'
import { DEHAZE_PRESETS, BasicParamsUIDefine, AdvancedParamsUIDefine, EnhancementParamsUIDefine } from './imports'
import { createSliderItemsComputed } from './dehazeControlItems'
import { getPresetName } from './dehazePanel.utils'
import type { ControlEvent } from './imports'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// 使用 Composable
const {
    dehazeParams,
    currentPreset,
    showAdvanced,
    isProcessing,
    hasAdjustments,
    emptyStateClass,
    contentContainerClass,
    handleBasicSliderUpdate,
    handleAdvancedSliderUpdate,
    handleEnhancementSliderUpdate,
    applyPreset,
    resetDehaze
} = useDehazePanel((event: 'controlEvent', data: ControlEvent) => {
    emit(event, data)
})

// 滑块项计算
const basicSliderItems = createSliderItemsComputed(BasicParamsUIDefine, dehazeParams)
const advancedSliderItems = createSliderItemsComputed(AdvancedParamsUIDefine, dehazeParams)
const enhancementSliderItems = createSliderItemsComputed(EnhancementParamsUIDefine, dehazeParams)
</script>