<template>
    <!-- Layers Section -->
    <div v-if="layers.length > 0" class="layers-section mt-4 pt-4 border-t border-white/5">
        <h4 class="text-sm text-white/70 mb-2">调整图层 ({{ layers.length }})</h4>
        <div class="layers-list flex flex-col gap-1 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
            <div v-for="layer in layers" :key="layer.id"
                class="layer-item flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded cursor-pointer transition-all"
                :class="{ 'border-blue-500 bg-blue-500/10': activeLayerId === layer.id }"
                @click="emit('select-layer', layer.id)">
                <div class="layer-info flex items-center gap-2 flex-1 overflow-hidden">
                    <input type="checkbox" :checked="layer.visible" @change.stop="updateLayerVisible(layer, $event)"
                        class="layer-visibility cursor-pointer" />
                    <span class="layer-name text-xs font-medium truncate">{{ layer.name }}</span>
                    <span class="layer-type text-[10px] px-1 py-0.5 bg-white/10 rounded text-white/60">{{
                        layer.type === 'hsl' ? 'HSL' : 'Color' }}</span>
                </div>
                <button class="remove-layer-btn text-sm px-1 text-white/50 hover:text-red-500 transition-colors"
                    @click.stop="emit('remove-layer', layer.id)">×</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AdjustmentLayer } from './imports'
import { isHTMLInputElement } from './imports'
import type { LayersListProps, LayersListEmits } from './LayersList.types'

const props = defineProps<LayersListProps>()
const emit = defineEmits<LayersListEmits>()

const updateLayerVisible = (layer: AdjustmentLayer, event: Event) => {
    if (isHTMLInputElement(event.target)) {
        emit('update-layer', layer.id, { visible: event.target.checked })
    }
}
</script>
