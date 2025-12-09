<template>
    <div v-if="quantizedColorBlocks.length > 0" :class="[
        'color-block-section',
        isMobile ? 'flex-shrink-0' : ''
    ]">
        <h4 class="text-xs text-white/60 font-bold mb-2 whitespace-nowrap">图像量化色块</h4>
        <div class="color-blocks flex gap-2" :class="isMobile ? 'flex-nowrap' : 'flex-wrap'">
            <div v-for="(color, index) in quantizedColorBlocks" :key="`quantized-${index}`" :class="[
                'color-block rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center font-bold text-white shadow-sm border-2 border-white/10 hover:scale-110 hover:shadow-md hover:z-10',
                isMobile ? 'w-16 h-16 text-xs' : 'w-10 h-10 text-[9px]',
                'flex-shrink-0'
            ]" :style="{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }"
                @click="emit('add-color-layer', color)"
                :title="`RGB(${color.r}, ${color.g}, ${color.b}) - 出现${color.count}次`">
                <span class="drop-shadow-md">{{ color.count }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RGBColor } from './imports'

interface Props {
    quantizedColorBlocks: RGBColor[]
    isMobile?: boolean
}

interface Emits {
    (e: 'add-color-layer', color: RGBColor): void
}

const props = withDefaults(defineProps<Props>(), {
    isMobile: false
})

const emit = defineEmits<Emits>()
</script>