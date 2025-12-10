<template>
    <div :class="[
        'color-block-section',
        isMobile ? 'flex-shrink-0' : ''
    ]">
        <h4 class="text-xs text-white/60 font-bold mb-2 whitespace-nowrap">常用HSL色块</h4>
        <div class="color-blocks flex gap-2" :class="isMobile ? 'flex-nowrap' : 'flex-wrap'">
            <div v-for="(hslBlock, index) in commonHslBlocks" :key="`hsl-${index}`" :class="[
                'color-block hsl-block rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center font-bold text-white shadow-sm border border-white/10 hover:scale-110 hover:shadow-md hover:z-10 text-center leading-tight',
                isMobile ? 'w-16 h-16 text-xs' : 'w-10 h-10 text-[9px]',
                'flex-shrink-0'
            ]" :style="{ backgroundColor: getHslBlockColor(hslBlock) }"
                @click="emit('add-hsl-layer', hslBlock)" :title="hslBlock.name">
                <span class="drop-shadow-md">{{ hslBlock.name }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getHslBlockColor, type HSLRange } from './imports'
import type { CommonHslBlocksProps, CommonHslBlocksEmits } from './hsl/types'

const props = defineProps<CommonHslBlocksProps>()
const emit = defineEmits<CommonHslBlocksEmits>()
</script>