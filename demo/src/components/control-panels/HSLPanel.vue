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
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import type { HSLAdjustmentLayer } from '../../utils/hslAdjustStep'
import { createUpdateDataEvent } from '../../types/controlEvents'
import type { ControlEvent } from '../../types/controlEvents'
import { getGlobalSliderItems, getLayerSliderItems, COMMON_COLORS, getLayerSchema, MetaSchema } from './hsl/params'
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

const globalSliderItems = computed(getGlobalSliderItems(
    {
        globalHSL
    }
))

// Methods
const handleGlobalSliderUpdate = (data: { id: string; value: number | string }) => {
    // 强制转换为number,防止字符串导致NaN
    const numericValue = typeof data.value === 'string' ? parseFloat(data.value) : data.value
    if (isNaN(numericValue)) {
        console.error(`[HSLPanel] Invalid value for ${data.id}: ${data.value}`)
        return
    }

    if (data.id === 'global-hue') globalHSL.value.hue = numericValue
    else if (data.id === 'global-saturation') globalHSL.value.saturation = numericValue
    else if (data.id === 'global-lightness') globalHSL.value.lightness = numericValue

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


const handleLayerSliderUpdate = (layerId: string, data: { id: string; value: number | string }) => {
    const layer = hslLayers.value.find(l => l.id === layerId)
    if (!layer) {
        console.error(`[HSLPanel] Layer not found: ${layerId}`)
        return
    }

    // 强制转换为number,防止字符串导致NaN
    let numericValue: number
    if (typeof data.value === 'string') {
        numericValue = parseFloat(data.value)
    } else if (typeof data.value === 'number') {
        numericValue = data.value
    } else {
        console.error(`[HSLPanel] Invalid value type for ${data.id}: ${typeof data.value}`)
        return
    }

    // 检查是否为有效数字
    if (isNaN(numericValue) || !isFinite(numericValue)) {
        console.error(`[HSLPanel] Invalid value for ${data.id}: ${data.value}`)
        return
    }

    // 根据字段类型设置适当的默认值和范围
    const updates: Partial<HSLAdjustmentLayer> = {}
    
    if (data.id === 'hue') {
        updates.hue = Math.max(-180, Math.min(180, numericValue))
    } else if (data.id === 'saturation') {
        updates.saturation = Math.max(-100, Math.min(100, numericValue))
    } else if (data.id === 'lightness') {
        updates.lightness = Math.max(-100, Math.min(100, numericValue))
    } else if (data.id === 'precision') {
        updates.precision = Math.max(0, Math.min(100, numericValue))
    } else if (data.id === 'range') {
        updates.range = Math.max(0, Math.min(100, numericValue))
    } else {
        console.error(`[HSLPanel] Unknown field: ${data.id}`)
        return
    }

    Object.assign(layer, updates)
    emit('controlEvent', createUpdateDataEvent('update-hsl-layer', { id: layerId, updates }))
}
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>

