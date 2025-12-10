<template>
    <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-white/80">
                增强参数
            </label>
        </div>

        <div class="space-y-3">
            <Slider 
                v-for="param in enhancementParams" 
                :key="param.id"
                :items="[getSliderItem(param)]" 
                @updateValue="handleParamUpdate" 
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Slider } from '@leolee9086/slider-component'
import { enhancementParams, createSliderItem } from './sliderParams.config'
import type { ClarityParams } from './imports'
import type { SliderParamConfig } from './sliderParams.types'

const props = defineProps<{
    isMobile?: boolean
    clarityParams: ClarityParams
}>()

const emit = defineEmits<{
    'update-value': [data: { id: string; value: number }]
}>()

// 根据配置生成 SliderItem
const getSliderItem = (param: SliderParamConfig) =>
    createSliderItem(param, props.clarityParams)

// 处理参数更新
const handleParamUpdate = (data: { id: string; value: number }) => {
    emit('update-value', data)
}
</script>