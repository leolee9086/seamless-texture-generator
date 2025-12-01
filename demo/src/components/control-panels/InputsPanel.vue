<template>
    <div class="flex flex-col" :class="isMobile ? 'gap-6' : 'gap-6'">
        <!-- Image Source Selection -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <span :class="headerClass">Source</span>
                <div class="flex gap-2">
                    <button @click="$emit('load-sample')" :disabled="isProcessing" :class="actionButtonClass">
                        Sample
                    </button>
                    <label :class="actionButtonClass + ' cursor-pointer flex items-center'">
                        <div class="i-carbon-camera" :class="isMobile ? '' : 'mr-2'"></div>
                        <span :class="isMobile ? 'ml-1.5' : ''">Camera</span>
                        <input type="file" accept="image/*" capture="environment"
                            @change="$emit('image-upload', $event)" class="hidden" />
                    </label>
                </div>
            </div>

            <label :class="uploadAreaClass">
                <div class="absolute inset-0 flex flex-col items-center justify-center z-10"
                    :class="isMobile ? 'gap-2' : 'gap-3'">
                    <div
                        :class="['i-carbon-image text-white/50 group-hover:text-white group-hover:scale-110 transition-all duration-300', isMobile ? 'text-3xl' : 'text-1xl']">
                    </div>
                    <div class="flex flex-col items-center">
                        <span :class="uploadTextClass">{{ originalImage ? 'Change Image' : 'Select Image' }}</span>
                        <span v-if="!isMobile" class="text-xs text-white/40 mt-1">Click to upload</span>
                    </div>
                </div>
                <!-- Preview Background -->
                <div v-if="originalImage" :class="previewClass" :style="{ backgroundImage: `url(${originalImage})` }">
                </div>
                <input type="file" accept="image/*" @change="$emit('image-upload', $event)" class="hidden" />
            </label>
        </div>

        <!-- Max Resolution Slider -->
        <div v-if="originalImage" :class="sliderContainerClass">
            <Slider :items="inputSliderItems" @updateValue="$emit('slider-update', $event)" />
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
    inputSliderItems: any[]
}>()

defineEmits<{
    'load-sample': []
    'image-upload': [event: Event]
    'slider-update': [data: { id: string; value: number }]
}>()

const headerClass = computed(() =>
    props.isMobile
        ? 'text-xs font-bold text-gray-400 uppercase tracking-wider'
        : 'text-sm font-medium text-gray-400 uppercase tracking-wider'
)

const actionButtonClass = computed(() =>
    props.isMobile
        ? 'px-3 py-1.5 rounded-full bg-white/10 border border-white/5 text-xs font-medium text-white'
        : 'px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/5 text-xs font-medium text-white transition-all disabled:opacity-50'
)

const uploadAreaClass = computed(() =>
    props.isMobile
        ? 'relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 h-28 flex items-center justify-center'
        : 'relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group h-32 flex items-center justify-center'
)

const uploadTextClass = computed(() =>
    props.isMobile
        ? 'text-xs font-medium text-white/90'
        : 'text-sm font-medium text-white/90'
)

const previewClass = computed(() =>
    props.isMobile
        ? 'absolute inset-0 opacity-30 blur-lg bg-cover bg-center'
        : 'absolute inset-0 opacity-20 blur-xl bg-cover bg-center'
)

const sliderContainerClass = computed(() =>
    props.isMobile
        ? 'bg-white/5 rounded-2xl border border-white/5'
        : 'bg-white/5 rounded-2xl border border-white/5'
)
</script>
