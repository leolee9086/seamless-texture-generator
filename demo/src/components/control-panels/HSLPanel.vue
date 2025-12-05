<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-color-palette text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- Global HSL Adjustment -->
            <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        全局HSL调整
                    </label>
                    <button @click="resetGlobalHSL"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasGlobalAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="globalSliderItems" @updateValue="handleGlobalSliderUpdate" />
            </div>

            <!-- Color-Specific HSL Layers -->
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
                        <button v-for="color in commonColors" :key="color"
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
                            <Slider :items="getLayerSliderItems(layer)"
                                @updateValue="(data) => handleLayerSliderUpdate(layer.id, data)" />
                        </div>
                    </div>
                </div>

                <div v-else class="text-center text-white/30 text-xs py-4">
                    暂无色块调整层
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import type { HSLAdjustmentLayer } from '../../utils/hslAdjustStep'
import { createUpdateDataEvent } from '../../types/controlEvents'
import type { ControlEvent } from '../../types/controlEvents'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    globalHSL?: { hue: number; saturation: number; lightness: number }
    hslLayers?: HSLAdjustmentLayer[]
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State - 使用props中的状态，如果没有则使用默认值
const globalHSL = ref({
    hue: props.globalHSL?.hue || 0,
    saturation: props.globalHSL?.saturation || 0,
    lightness: props.globalHSL?.lightness || 0
})

const hslLayers = ref<HSLAdjustmentLayer[]>(props.hslLayers || [])
const activeLayerId = ref<string | null>(null)
const showColorPicker = ref(false)
const selectedColor = ref('#FF0000')

// 监听props变化，同步本地状态
watch(() => props.globalHSL, (newGlobalHSL) => {
    if (newGlobalHSL) {
        globalHSL.value = {
            hue: newGlobalHSL.hue,
            saturation: newGlobalHSL.saturation,
            lightness: newGlobalHSL.lightness
        }
    }
}, { deep: true })

watch(() => props.hslLayers, (newHslLayers) => {
    if (newHslLayers) {
        hslLayers.value = [...newHslLayers]
    }
}, { deep: true })

// 常用颜色
const commonColors = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
    '#FF00FF', '#8B4513', '#FFFFFF', '#808080', '#000000', '#FFB6C1'
]

// Computed
const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile
        ? 'flex flex-col gap-3'
        : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
)

const hasGlobalAdjustments = computed(() =>
    globalHSL.value.hue !== 0 || globalHSL.value.saturation !== 0 || globalHSL.value.lightness !== 0
)

const globalSliderItems = computed(() => [
    {
        id: 'global-hue',
        label: '色相',
        value: globalHSL.value.hue,
        min: -180,
        max: 180,
        step: 1,
        gradient: 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
        showRuler: false
    },
    {
        id: 'global-saturation',
        label: '饱和度',
        value: globalHSL.value.saturation,
        min: -100,
        max: 100,
        step: 1,
        gradient: 'linear-gradient(90deg, #888 0%, #ff0000 100%)',
        showRuler: false
    },
    {
        id: 'global-lightness',
        label: '明度',
        value: globalHSL.value.lightness,
        min: -100,
        max: 100,
        step: 1,
        gradient: 'linear-gradient(90deg, #000 0%, #888 50%, #fff 100%)',
        showRuler: false
    }
])

// Methods
const handleGlobalSliderUpdate = (data: { id: string; value: number }) => {
    if (data.id === 'global-hue') globalHSL.value.hue = data.value
    else if (data.id === 'global-saturation') globalHSL.value.saturation = data.value
    else if (data.id === 'global-lightness') globalHSL.value.lightness = data.value

    // 创建全局HSL调整层
    const globalLayer: HSLAdjustmentLayer = {
        id: 'global-hsl-layer',
        type: 'global',
        hue: globalHSL.value.hue,
        saturation: globalHSL.value.saturation,
        lightness: globalHSL.value.lightness
    }

    emit('controlEvent', createUpdateDataEvent('global-hsl-change', globalLayer))
}

const resetGlobalHSL = () => {
    globalHSL.value = { hue: 0, saturation: 0, lightness: 0 }
    
    // 创建重置后的全局HSL调整层
    const globalLayer: HSLAdjustmentLayer = {
        id: 'global-hsl-layer',
        type: 'global',
        hue: 0,
        saturation: 0,
        lightness: 0
    }
    
    emit('controlEvent', createUpdateDataEvent('global-hsl-change', globalLayer))
}

const addColorLayer = (color: string) => {
    const newLayer: HSLAdjustmentLayer = {
        id: crypto.randomUUID(),
        type: 'selective',
        targetColor: color,
        hue: 0,
        saturation: 0,
        lightness: 0,
        precision: 30,
        range: 50
    }
    hslLayers.value.push(newLayer)
    activeLayerId.value = newLayer.id
    showColorPicker.value = false
    emit('controlEvent', createUpdateDataEvent('add-hsl-layer', newLayer))
}

const removeLayer = (id: string) => {
    hslLayers.value = hslLayers.value.filter(l => l.id !== id)
    if (activeLayerId.value === id) {
        activeLayerId.value = null
    }
    emit('controlEvent', createUpdateDataEvent('remove-hsl-layer', id))
}

const toggleLayer = (id: string) => {
    activeLayerId.value = activeLayerId.value === id ? null : id
}

const getLayerSliderItems = (layer: HSLAdjustmentLayer) => [
    {
        id: 'hue',
        label: '色相',
        value: layer.hue,
        min: -180,
        max: 180,
        step: 1,
        gradient: 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
        showRuler: false
    },
    {
        id: 'saturation',
        label: '饱和度',
        value: layer.saturation,
        min: -100,
        max: 100,
        step: 1,
        gradient: `linear-gradient(90deg, #888 0%, ${layer.targetColor} 100%)`,
        showRuler: false
    },
    {
        id: 'lightness',
        label: '明度',
        value: layer.lightness,
        min: -100,
        max: 100,
        step: 1,
        gradient: `linear-gradient(90deg, #000 0%, ${layer.targetColor} 50%, #fff 100%)`,
        showRuler: false
    },
    {
        id: 'precision',
        label: '精确度',
        value: layer.precision || 30,
        min: 0,
        max: 100,
        step: 1,
        gradient: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #4cd964 100%)',
        showRuler: true
    },
    {
        id: 'range',
        label: '羽化范围',
        value: layer.range || 50,
        min: 0,
        max: 100,
        step: 1,
        gradient: 'linear-gradient(90deg, #007aff 0%, #5ac8fa 50%, #ffffff 100%)',
        showRuler: true
    }
]

const handleLayerSliderUpdate = (layerId: string, data: { id: string; value: number }) => {
    const layer = hslLayers.value.find(l => l.id === layerId)
    if (!layer) return

    const updates: Partial<HSLAdjustmentLayer> = {}
    if (data.id === 'hue') updates.hue = data.value
    else if (data.id === 'saturation') updates.saturation = data.value
    else if (data.id === 'lightness') updates.lightness = data.value
    else if (data.id === 'precision') updates.precision = data.value
    else if (data.id === 'range') updates.range = data.value

    Object.assign(layer, updates)
    emit('controlEvent', createUpdateDataEvent('update-hsl-layer', { id: layerId, updates }))
}
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>
