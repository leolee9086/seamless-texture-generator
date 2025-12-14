<template>
    <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-white/80">
                LUT Library
            </label>
            <button @click="$emit('update-all-thumbnails')" :disabled="isUpdatingThumbnails || !originalImage"
                class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                <div :class="isUpdatingThumbnails ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-renew'">
                </div>
                <span>Update All</span>
            </button>
        </div>

        <LUTGallery :luts="luts" :selected-id="selectedLutId" @trigger-upload="triggerUpload"
            @select="$emit('select-lut', $event)" @delete="$emit('delete-lut', $event)"
            @update-thumbnail="$emit('update-thumbnail', $event)" />

        <!-- Hidden Input -->
        <input ref="lutInputRef" type="file" accept=".cube" multiple @change="handleFileChange" class="hidden" />

        <!-- Selected LUT Controls -->
        <div v-if="selectedLutId" class="mt-4 border-t border-white/5 pt-4">
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-white/60">{{ selectedLutName }}</span>
                <div class="flex gap-2">
                    <button v-if="processedImage" @click="$emit('update-current-thumbnail')"
                        class="glass-btn p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                        title="Update thumbnail from current result">
                        <div class="i-carbon-image-copy text-sm"></div>
                    </button>
                    <button @click="$emit('clear-selection')"
                        class="glass-btn p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                        title="Clear selection">
                        <div class="i-carbon-close text-sm"></div>
                    </button>
                </div>
            </div>

            <Slider :items="lutSliderItems" @updateValue="$emit('slider-update', $event)" />
        </div>

        <!-- Desktop Color Block Selector (Full Mode) -->
        <div v-if="!isMobile && selectedLutId" class="mt-4 border-t border-white/5 pt-4">
            <ColorBlockSelector :processing="false" :quantized-color-blocks="quantizedColorBlocks"
                :common-hsl-blocks="commonHslBlocks" :layers="layers" :active-layer-id="activeLayerId"
                :is-mobile="false" @add-color-layer="$emit('add-color-layer', $event)"
                @add-hsl-layer="$emit('add-hsl-layer', $event)" @remove-layer="$emit('remove-layer', $event)"
                @select-layer="$emit('select-layer', $event)"
                @update-layer="(id, updates) => $emit('update-layer', id, updates)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import LUTGallery from './LUTGallery.vue'
import ColorBlockSelector from '../ColorBlockSelector.vue'
import type { LUTItem } from '../../../utils/lutDb'
import type { AdjustmentLayer } from '../../../composables/useColorBlockSelector.types'
import type { RGBColor } from '../../../utils/lut/colorQuantization'
import type { HSLRange } from '../../../utils/lut/hslMask'

const props = defineProps<{
    isMobile?: boolean
    luts: LUTItem[]
    selectedLutId: string | null
    selectedLutName: string | null
    originalImage: string | null
    processedImage?: string | null
    isUpdatingThumbnails: boolean
    lutSliderItems: any[]
    // ColorBlockSelector props
    quantizedColorBlocks: RGBColor[]
    commonHslBlocks: HSLRange[]
    layers: AdjustmentLayer[]
    activeLayerId: string | null
}>()

const emit = defineEmits<{
    'update-all-thumbnails': []
    'files-selected': [files: FileList]
    'select-lut': [lut: LUTItem]
    'delete-lut': [id: string]
    'update-thumbnail': [id: string]
    'update-current-thumbnail': []
    'clear-selection': []
    'slider-update': [data: { id: string; value: number }]
    // ColorBlockSelector events
    'add-color-layer': [color: RGBColor]
    'add-hsl-layer': [range: HSLRange]
    'remove-layer': [id: string]
    'select-layer': [id: string]
    'update-layer': [id: string, changes: Partial<AdjustmentLayer>]
}>()

const lutInputRef = ref<HTMLInputElement>()

const triggerUpload = () => {
    lutInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
        emit('files-selected', input.files)
    }
    input.value = ''
}
</script>
