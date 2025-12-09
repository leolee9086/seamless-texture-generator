<template>
    <div v-if="activeLayer" class="layer-adjustment-panel mt-3 p-3 bg-white/5 rounded border border-white/5">
        <h4 class="text-xs text-white/80 mb-2 pb-2 border-b border-white/5">图层设置: {{ activeLayer.name }}</h4>

        <!-- Common Settings -->
        <Slider :items="commonSliderItems" @updateValue="handleSliderUpdate" />

        <div class="control-row flex items-center justify-between mb-2 text-xs mt-2">
            <label>混合模式:</label>
            <select :value="activeLayer.blendMode" @change="updateLayerBlendMode"
                class="w-3/5 px-1 py-0.5 bg-white/5 border border-white/10 text-white rounded text-xs">
                <option value="max">最大值 (Max)</option>
                <option value="add">叠加 (Add)</option>
                <option value="multiply">正片叠底 (Multiply)</option>
                <option value="min">最小值 (Min)</option>
            </select>
        </div>

        <!-- HSL Settings -->
        <div v-if="activeLayer.type === 'hsl' && activeLayer.hslRange" class="hsl-controls mt-2">
            <Slider :items="hslSliderItems" @updateValue="handleSliderUpdate" />
        </div>

        <!-- Quantized Color Settings -->
        <div v-if="activeLayer.type === 'quantized'" class="quantized-controls">
            <Slider :items="quantizedSliderItems" @updateValue="handleSliderUpdate" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import type { AdjustmentLayer } from './imports'

interface Props {
    activeLayer: AdjustmentLayer | null
}

interface Emits {
    (e: 'update-layer', id: string, updates: Partial<AdjustmentLayer>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Slider items for common settings
const commonSliderItems = computed(() => {
    if (!props.activeLayer) return []
    return [
        {
            id: 'layer-intensity',
            label: '强度',
            value: props.activeLayer.intensity,
            min: 0,
            max: 1,
            step: 0.01,
            format: (val: number) => `${Math.round(val * 100)}%`
        }
    ]
})

// Slider items for HSL settings
const hslSliderItems = computed(() => {
    if (!props.activeLayer || !props.activeLayer.hslRange) return []
    const hsl = props.activeLayer.hslRange
    return [
        {
            id: 'hsl-hue',
            label: '色相中心',
            value: hsl.hue,
            min: 0,
            max: 360,
            step: 1,
            format: (val: number) => `${Math.round(val)}°`,
            group: '色相 (Hue)'
        },
        {
            id: 'hsl-hueTolerance',
            label: '色相容差',
            value: hsl.hueTolerance,
            min: 0,
            max: 180,
            step: 1,
            group: '色相 (Hue)'
        },
        {
            id: 'hsl-saturation',
            label: '饱和度中心',
            value: hsl.saturation,
            min: 0,
            max: 100,
            step: 1,
            format: (val: number) => `${Math.round(val)}%`,
            group: '饱和度 (Saturation)'
        },
        {
            id: 'hsl-saturationTolerance',
            label: '饱和度容差',
            value: hsl.saturationTolerance,
            min: 0,
            max: 100,
            step: 1,
            group: '饱和度 (Saturation)'
        },
        {
            id: 'hsl-lightness',
            label: '明度中心',
            value: hsl.lightness,
            min: 0,
            max: 100,
            step: 1,
            format: (val: number) => `${Math.round(val)}%`,
            group: '明度 (Lightness)'
        },
        {
            id: 'hsl-lightnessTolerance',
            label: '明度容差',
            value: hsl.lightnessTolerance,
            min: 0,
            max: 100,
            step: 1,
            group: '明度 (Lightness)'
        },
        {
            id: 'hsl-feather',
            label: '羽化',
            value: hsl.feather,
            min: 0,
            max: 1,
            step: 0.05,
            format: (val: number) => val.toFixed(2)
        }
    ]
})

// Slider items for quantized color settings
const quantizedSliderItems = computed(() => {
    if (!props.activeLayer || props.activeLayer.type !== 'quantized') return []
    return [
        {
            id: 'quantized-tolerance',
            label: '颜色容差',
            value: props.activeLayer.tolerance || 0,
            min: 0,
            max: 100,
            step: 1
        }
    ]
})

const updateLayerBlendMode = (event: Event) => {
    if (!props.activeLayer) return
    const target = event.target as HTMLSelectElement
    emit('update-layer', props.activeLayer.id, { blendMode: target.value as any })
}

const handleSliderUpdate = (data: { id: string; value: number | string }) => {
    if (!props.activeLayer) return

    // Handle common settings
    if (data.id === 'layer-intensity') {
        emit('update-layer', props.activeLayer.id, { intensity: data.value as number })
        return
    }

    // Handle HSL parameters
    if (data.id.startsWith('hsl-') && props.activeLayer.hslRange) {
        const param = data.id.replace('hsl-', '')
        const newHslRange = { ...props.activeLayer.hslRange, [param]: data.value }
        emit('update-layer', props.activeLayer.id, { hslRange: newHslRange })
        return
    }

    // Handle quantized parameters
    if (data.id.startsWith('quantized-')) {
        const param = data.id.replace('quantized-', '')
        emit('update-layer', props.activeLayer.id, { [param]: data.value })
    }
}
</script>