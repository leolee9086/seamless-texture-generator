<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- LUT启用开关 -->
            <div class="flex items-center justify-between px-4 py-3">
                <span class="text-sm font-medium text-white/80">Enable LUT</span>
                <button @click="$emit('toggle-lut')" :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    lutEnabled ? 'bg-blue-600' : 'bg-white/20'
                ]">
                    <span :class="[
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        lutEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"></span>
                </button>
            </div>

            <!-- LUT文件选择 -->
            <div class="px-4 pb-3">
                <label class="block text-sm font-medium text-white/80 mb-2">
                    LUT File (.cube)
                </label>
                <div class="flex gap-2">
                    <input ref="lutInputRef" type="file" accept=".cube" @change="handleLUTFileChange" class="hidden" />
                    <button @click="lutInputRef?.click()" :class="[
                        'flex-1 px-4 py-2 rounded-lg font-medium text-sm',
                        'bg-white/10 hover:bg-white/15 text-white/90',
                        'border border-white/10 transition-colors',
                        'flex items-center justify-center gap-2'
                    ]">
                        <div class="i-carbon-document text-base"></div>
                        <span>{{ lutFileName || 'Select LUT File' }}</span>
                    </button>
                    <button v-if="lutFileName" @click="$emit('clear-lut')" :class="[
                        'px-3 py-2 rounded-lg',
                        'bg-white/10 hover:bg-white/15 text-white/90',
                        'border border-white/10 transition-colors'
                    ]">
                        <div class="i-carbon-close text-base"></div>
                    </button>
                </div>
            </div>

            <!-- LUT强度滑块 -->
            <div v-if="lutEnabled && lutFileName" class="px-4 pb-4">
                <Slider :items="lutSliderItems" @updateValue="handleSliderUpdate" />
            </div>

            <!-- LUT状态提示 -->
            <div v-if="lutEnabled && !lutFileName" class="px-4 pb-3">
                <div
                    class="text-xs text-yellow-400/80 bg-yellow-400/10 rounded-lg px-3 py-2 border border-yellow-400/20">
                    <div class="flex items-start gap-2">
                        <div class="i-carbon-warning text-sm mt-0.5"></div>
                        <span>Please select a LUT file to apply color grading</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    lutEnabled: boolean
    lutIntensity: number
    lutFileName: string | null
}>()

const emit = defineEmits<{
    'toggle-lut': []
    'lut-file-change': [file: File]
    'clear-lut': []
    'slider-update': [data: { id: string; value: number }]
}>()

const lutInputRef = ref<HTMLInputElement>()

const lutSliderItems = computed(() => [
    {
        id: 'lut-intensity',
        label: 'LUT Intensity',
        value: props.lutIntensity,
        min: 0,
        max: 1,
        step: 0.01,
    }
])

const handleLUTFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
        emit('lut-file-change', file)
    }
}

const handleSliderUpdate = (data: { id: string; value: number }) => {
    emit('slider-update', data)
}

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile
        ? 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
        : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
)
</script>
