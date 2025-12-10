<template>
    <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-white/80">
                色块调整层
            </label>
            <button @click="showColorPicker = !showColorPicker"
                class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1">
                <div class="i-carbon-add"></div>
                <span>添加色块</span>
            </button>
        </div>

        <!-- Color Picker -->
        <div v-if="showColorPicker" class="mb-3 p-3 bg-black/30 rounded-lg border border-white/10">
            <div class="grid grid-cols-6 gap-2 mb-3">
                <button v-for="color in COMMON_COLORS" :key="color"
                    class="w-full aspect-square rounded-lg border-2 transition-all hover:scale-110"
                    :style="{ backgroundColor: color }"
                    :class="selectedColor === color ? 'border-white shadow-lg' : 'border-white/20'"
                    @click="addColorLayer(color)">
                </button>
            </div>
            <button @click="showColorPicker = false"
                class="w-full glass-btn text-xs py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors">
                取消
            </button>
        </div>

        <!-- HSL Layers List -->
        <div v-if="hslLayers.length > 0" class="flex flex-col gap-2">
            <div v-for="layer in hslLayers" :key="layer.id" class="relative rounded-lg border transition-all"
                :class="activeLayerId === layer.id ? 'border-white/40 bg-white/5' : 'border-white/10 bg-black/20'">
                <!-- Layer Header -->
                <div class="flex items-center justify-between p-2 cursor-pointer"
                    @click="toggleLayer(layer.id)">
                    <div class="flex items-center gap-2 flex-1">
                        <div class="w-6 h-6 rounded border border-white/20 flex-shrink-0"
                            :style="{ backgroundColor: layer.targetColor }">
                        </div>
                        <span class="text-xs text-white/80 font-medium truncate">
                            {{ layer.targetColor }}
                        </span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button @click.stop="removeLayer(layer.id)"
                            class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors">
                            <div class="i-carbon-trash-can text-sm"></div>
                        </button>
                        <div class="i-carbon-chevron-down text-sm text-white/60 transition-transform"
                            :class="{ 'rotate-180': activeLayerId === layer.id }">
                        </div>
                    </div>
                </div>

                <!-- Layer Controls (Expanded) -->
                <div v-if="activeLayerId === layer.id" class="px-2 pb-2 border-t border-white/10">
                    <Slider :items="getLayerSliderItems(layer).get()"
                        @updateValue="(data) => handleLayerSliderUpdate(layer.id, data)" />
                </div>
            </div>
        </div>

        <div v-else class="text-center text-white/30 text-xs py-4">
            暂无色块调整层
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import type { HSLAdjustmentLayer } from '../../../adjustments/hsl/hslAdjustStep'
import { createUpdateDataEvent } from '../../../types/controlEvents'
import type { ControlEvent } from '../../../types/controlEvents'
import { getLayerSliderItems, COMMON_COLORS, getLayerSchema, MetaSchema } from './params'

const props = defineProps<{
    isMobile?: boolean
    hslLayers?: HSLAdjustmentLayer[]
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State
const hslLayers = ref<HSLAdjustmentLayer[]>(props.hslLayers || [])
const activeLayerId = ref<string | null>(null)
const showColorPicker = ref(false)
const selectedColor = ref('#FF0000')

// 监听props变化，同步本地状态
watch(() => props.hslLayers, (newHslLayers) => {
    if (newHslLayers) {
        hslLayers.value = [...newHslLayers]
    }
}, { deep: true })

// Methods
const addColorLayer = (color: string) => {
    // 从schema中获取默认值，避免硬编码
    const tempLayer: HSLAdjustmentLayer = {
        id: 'temp',
        type: 'selective',
        targetColor: color,
        hue: 0,
        saturation: 0,
        lightness: 0
    }

    const schema = getLayerSchema(tempLayer)

    // 使用MetaSchema验证并提取元数据
    const precisionResult = MetaSchema.safeParse(schema.shape.precision.meta())
    const rangeResult = MetaSchema.safeParse(schema.shape.range.meta())

    const precisionDefaultValue = (precisionResult.success && precisionResult.data.defaultValue != null)
        ? precisionResult.data.defaultValue
        : 30
    const rangeDefaultValue = (rangeResult.success && rangeResult.data.defaultValue != null)
        ? rangeResult.data.defaultValue
        : 50

    const newLayer: HSLAdjustmentLayer = {
        id: crypto.randomUUID(),
        type: 'selective',
        targetColor: color,
        hue: 0,
        saturation: 0,
        lightness: 0,
        precision: precisionDefaultValue,
        range: rangeDefaultValue
    }
    
    // 发出事件，让父组件处理状态更新
    emit('controlEvent', createUpdateDataEvent('add-hsl-layer', newLayer))
}

const removeLayer = (id: string) => {
    // 发出事件，让父组件处理状态更新
    emit('controlEvent', createUpdateDataEvent('remove-hsl-layer', id))
}

const toggleLayer = (id: string) => {
    activeLayerId.value = activeLayerId.value === id ? null : id
}

const handleLayerSliderUpdate = (layerId: string, data: { id: string; value: number | string }) => {
    // 发出事件，让父组件处理状态更新
    emit('controlEvent', createUpdateDataEvent('update-hsl-layer', { id: layerId, data }))
}
</script>

