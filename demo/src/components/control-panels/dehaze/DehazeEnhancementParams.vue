<template>
    <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-white/80">
                增强参数
            </label>
        </div>

        <Slider :items="items" @updateValue="$emit('updateValue', $event)" />
    </div>
</template>

<script setup lang="ts">
import { Slider } from '@leolee9086/slider-component'
import type { SliderItem } from './imports'

defineProps<{
    isMobile?: boolean
    items: SliderItem[]
}>()

defineEmits<{
    'updateValue': [event: { id: string; value: number }]
}>()
</script>
