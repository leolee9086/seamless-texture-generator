<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <Slider :items="settingsSliderItems" @updateValue="$emit('slider-update', $event)" />

            <button @click="$emit('process-image')" :disabled="isProcessing"
                class="w-full rounded-xl font-medium shadow-lg flex items-center justify-center relative overflow-hidden group"
                :class="[buttonClass, buttonStateClass]">

                <div v-if="isProcessing" :class="['i-carbon-circle-dash animate-spin', iconSizeClass]"></div>
                <div v-else
                    :class="['i-carbon-magic-wand', iconSizeClass, isMobile ? '' : 'group-hover:rotate-12 transition-transform']">
                </div>

                <span>{{ isProcessing ? 'Processing...' : (isMobile ? 'Make Seamless' : 'Generate Seamless Texture')
                    }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'

const props = defineProps<{
    isMobile?: boolean
    isProcessing: boolean
    originalImage: string | null
    settingsSliderItems: any[]
}>()

defineEmits<{
    'process-image': []
    'slider-update': [data: { id: string; value: number }]
}>()

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile ? 'flex flex-col gap-5 bg-white/5 rounded-2xl border border-white/5' : 'flex flex-col gap-4 bg-white/5 rounded-2xl border border-white/5'
)

const buttonClass = computed(() =>
    props.isMobile ? 'py-3.5 gap-2' : 'py-4 gap-3'
)

const buttonStateClass = computed(() =>
    props.isProcessing
        ? 'bg-white/10 cursor-not-allowed'
        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
)

const iconSizeClass = computed(() =>
    props.isMobile ? 'text-lg' : 'text-xl'
)
</script>
