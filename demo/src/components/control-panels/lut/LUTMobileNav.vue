<template>
    <Teleport to="#secondary-nav-container" v-if="isMobile">
        <div
            class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide w-full bg-black border-t border-white/5">
            <!-- LUT Tab -->
            <button @click="$emit('switch-tab', 'lut')"
                class="flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border transition-all duration-200"
                :class="activeMobileTab === 'lut' ? 'bg-white/20 border-white/40 text-white' : 'bg-black/40 border-white/10 text-white/50'">
                <div class="i-carbon-color-palette text-lg mb-0.5"></div>
                <span class="text-[9px] font-medium">LUT</span>
            </button>

            <!-- Layer Tabs -->
            <button v-for="layer in layers" :key="layer.id" @click="$emit('switch-tab', layer.id)"
                class="relative flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border transition-all duration-200 overflow-hidden"
                :class="activeMobileTab === layer.id ? 'border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'border-white/10 opacity-80'">
                <!-- Background Color Preview -->
                <div class="absolute inset-0 opacity-50"
                    :style="{ backgroundColor: layer.type === 'quantized' && layer.color ? `rgb(${layer.color.r},${layer.color.g},${layer.color.b})` : (layer.type === 'hsl' && layer.hslRange ? getHslBlockColor(layer.hslRange) : '#333') }">
                </div>
                <div class="relative z-10 text-xs font-bold text-white shadow-black drop-shadow-md">
                    {{ layer.type === 'hsl' ? 'HSL' : 'RGB' }}
                </div>
                <div v-if="!layer.visible" class="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                    <div class="i-carbon-view-off text-white/80 text-lg"></div>
                </div>
            </button>

            <!-- Add Button -->
            <button @click="$emit('switch-tab', 'add')"
                class="flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border border-dashed transition-all duration-200"
                :class="activeMobileTab === 'add' ? 'bg-white/10 border-white/40 text-white' : 'bg-transparent border-white/20 text-white/50'">
                <div class="i-carbon-add text-xl"></div>
            </button>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { getHslBlockColor } from '../../../utils/lut/getHslBlockColor'
import type { AdjustmentLayer } from '../../../composables/useColorBlockSelector.types'

defineProps<{
    isMobile?: boolean
    layers: AdjustmentLayer[]
    activeMobileTab: string
}>()

defineEmits<{
    'switch-tab': [tab: string]
}>()
</script>
