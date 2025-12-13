<template>
    <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-white/80">
                高级参数
            </label>
            <button @click="$emit('toggleAdvanced')"
                class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1">
                <div class="i-carbon-chevron-down text-sm transition-transform" :class="{ 'rotate-180': showAdvanced }">
                </div>
                <span>{{ showAdvanced ? '收起' : '展开' }}</span>
            </button>
        </div>

        <div v-if="showAdvanced" class="space-y-4">
            <Slider :items="items" @updateValue="$emit('updateValue', $event)" />

            <!-- 自适应选项 -->
            <div class="space-y-3">
                <LabeledCheckbox label="自适应模式" :modelValue="adaptiveMode"
                    @update:modelValue="$emit('update:adaptiveMode', $event)" />

                <LabeledCheckbox label="空间自适应" :modelValue="spatialAdaptiveMode"
                    @update:modelValue="$emit('update:spatialAdaptiveMode', $event)" :disabled="!adaptiveMode" />

                <LabeledCheckbox label="增强功能" :modelValue="enableEnhancement"
                    @update:modelValue="$emit('update:enableEnhancement', $event)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Slider } from '@leolee9086/slider-component'
import LabeledCheckbox from './LabeledCheckbox.vue'
import type { SliderItem } from './imports'

defineProps<{
    isMobile?: boolean
    showAdvanced: boolean
    items: SliderItem[]
    adaptiveMode: boolean
    spatialAdaptiveMode: boolean
    enableEnhancement: boolean
}>()

defineEmits<{
    'toggleAdvanced': []
    'updateValue': [event: { id: string; value: number }]
    'update:adaptiveMode': [value: boolean]
    'update:spatialAdaptiveMode': [value: boolean]
    'update:enableEnhancement': [value: boolean]
}>()
</script>
