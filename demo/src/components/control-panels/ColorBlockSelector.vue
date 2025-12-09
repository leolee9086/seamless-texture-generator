<template>
    <div class="input-group">
        <label v-if="!isMobile" class="text-white/80 text-sm font-medium mb-2 block">选择颜色范围:</label>
        <div :class="[
            'color-blocks-container flex gap-4',
            isMobile ? 'flex-row overflow-x-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-rounded pb-2' : 'flex-col'
        ]">
            <!-- Quantized Color Blocks -->
            <QuantizedColorBlocks
                v-if="showAdd"
                :quantizedColorBlocks="quantizedColorBlocks"
                :isMobile="isMobile"
                @add-color-layer="emit('add-color-layer', $event)" />

            <!-- Common HSL Blocks -->
            <CommonHslBlocks
                v-if="showAdd"
                :commonHslBlocks="commonHslBlocks"
                :isMobile="isMobile"
                @add-hsl-layer="emit('add-hsl-layer', $event)" />
        </div>

        <!-- Layers Section -->
        <LayersList v-if="showList" :layers="layers" :activeLayerId="activeLayerId"
            @select-layer="emit('select-layer', $event)"
            @remove-layer="emit('remove-layer', $event)"
            @update-layer="(id, updates) => emit('update-layer', id, updates)" />

        <!-- Layer Adjustment Panel -->
        <LayerAdjustmentPanel v-if="showSettings && activeLayer" :activeLayer="activeLayer"
            @update-layer="(id, updates) => emit('update-layer', id, updates)" />

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LayersList from './LayersList.vue'
import LayerAdjustmentPanel from './LayerAdjustmentPanel.vue'
import QuantizedColorBlocks from './QuantizedColorBlocks.vue'
import CommonHslBlocks from './CommonHslBlocks.vue'
import type { AdjustmentLayer, RGBColor, HSLRange } from './imports'

interface Props {
    processing: boolean
    quantizedColorBlocks: RGBColor[]
    commonHslBlocks: HSLRange[]
    layers: AdjustmentLayer[]
    activeLayerId: string | null
    mode?: 'full' | 'add-only' | 'settings-only' | 'list-only'
    isMobile: boolean
}

interface Emits {
    (e: 'add-color-layer', color: RGBColor): void
    (e: 'add-hsl-layer', hslBlock: HSLRange): void
    (e: 'remove-layer', id: string): void
    (e: 'select-layer', id: string): void
    (e: 'update-layer', id: string, updates: Partial<AdjustmentLayer>): void
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'full'
})
const emit = defineEmits<Emits>()

const showAdd = computed(() => props.mode === 'full' || props.mode === 'add-only')
const showList = computed(() => props.mode === 'full' || props.mode === 'list-only')
const showSettings = computed(() => props.mode === 'full' || props.mode === 'settings-only')

const activeLayer = computed(() => {
    return props.layers.find(l => l.id === props.activeLayerId)
})


</script>

