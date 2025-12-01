<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <div v-if="!isMobile" class="bg-white/5 rounded-2xl border border-white/5">
                <Slider :items="viewSliderItems" @updateValue="$emit('slider-update', $event)" />
            </div>
            <div v-else class="bg-white/5 rounded-2xl border border-white/5">
                <Slider :items="viewSliderItems" @updateValue="$emit('slider-update', $event)" />
            </div>

            <div :class="buttonGridClass">
                <button @click="$emit('reset-zoom')" :class="resetButtonClass">
                    <div :class="iconClass"></div>
                    <span :class="labelClass">Reset Zoom</span>
                </button>

                <button v-if="processedImage" @click="$emit('toggle-magnifier')" :class="magnifierButtonClass">
                    <div class="i-carbon-zoom-in" :class="iconClass"></div>
                    <span :class="labelClass">{{ magnifierEnabled ? 'Disable' : 'Enable' }} Magnifier</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    processedImage: string | null
    magnifierEnabled: boolean
    viewSliderItems: any[]
}>()

defineEmits<{
    'reset-zoom': []
    'toggle-magnifier': []
    'slider-update': [data: { id: string; value: number }]
}>()

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile ? 'flex flex-col gap-5' : 'flex flex-col gap-6'
)

const buttonGridClass = computed(() =>
    props.isMobile ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-4'
)

const resetButtonClass = computed(() =>
    props.isMobile
        ? 'py-3 px-3 rounded-xl bg-white/5 border border-white/5 text-white flex flex-col items-center gap-1'
        : 'py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all flex flex-col items-center gap-2'
)

const magnifierButtonClass = computed(() => {
    const base = props.isMobile
        ? 'py-3 px-3 rounded-xl border flex flex-col items-center gap-1'
        : 'py-3 px-4 rounded-xl border transition-all flex flex-col items-center gap-2'

    const state = props.magnifierEnabled
        ? 'bg-purple-500/20 border-purple-500/30 text-purple-200'
        : 'bg-white/5 hover:bg-white/10 border-white/5 text-white'

    return `${base} ${state}`
})

const iconClass = computed(() =>
    props.isMobile ? 'text-lg' : 'i-carbon-center-circle text-xl'
)

const labelClass = computed(() =>
    props.isMobile ? 'text-[10px] font-medium' : 'text-xs font-medium'
)
</script>
