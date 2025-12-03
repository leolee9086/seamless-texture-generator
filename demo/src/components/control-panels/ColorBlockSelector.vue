<template>
    <div class="input-group">
        <label v-if="!isMobile" class="text-white/80 text-sm font-medium mb-2 block">选择颜色范围:</label>
        <div :class="[
            'color-blocks-container flex gap-4',
            isMobile ? 'flex-row overflow-x-auto custom-scrollbar pb-2' : 'flex-col'
        ]">
            <!-- Quantized Color Blocks -->
            <div v-if="showAdd && quantizedColorBlocks.length > 0" :class="[
                'color-block-section',
                isMobile ? 'flex-shrink-0' : ''
            ]">
                <h4 class="text-xs text-white/60 font-bold mb-2 whitespace-nowrap">图像量化色块</h4>
                <div class="color-blocks flex gap-2" :class="isMobile ? 'flex-nowrap' : 'flex-wrap'">
                    <div v-for="(color, index) in quantizedColorBlocks" :key="`quantized-${index}`" :class="[
                        'color-block rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center font-bold text-white shadow-sm border-2 border-white/10 hover:scale-110 hover:shadow-md hover:z-10',
                        isMobile ? 'w-16 h-16 text-xs' : 'w-10 h-10 text-[9px]',
                        'flex-shrink-0'
                    ]" :style="{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }"
                        @click="emit('add-color-layer', color)"
                        :title="`RGB(${color.r}, ${color.g}, ${color.b}) - 出现${color.count}次`">
                        <span class="drop-shadow-md">{{ color.count }}</span>
                    </div>
                </div>
            </div>

            <!-- Common HSL Blocks -->
            <div v-if="showAdd" :class="[
                'color-block-section',
                isMobile ? 'flex-shrink-0' : ''
            ]">
                <h4 class="text-xs text-white/60 font-bold mb-2 whitespace-nowrap">常用HSL色块</h4>
                <div class="color-blocks flex gap-2" :class="isMobile ? 'flex-nowrap' : 'flex-wrap'">
                    <div v-for="(hslBlock, index) in commonHslBlocks" :key="`hsl-${index}`" :class="[
                        'color-block hsl-block rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center font-bold text-white shadow-sm border border-white/10 hover:scale-110 hover:shadow-md hover:z-10 text-center leading-tight',
                        isMobile ? 'w-16 h-16 text-xs' : 'w-10 h-10 text-[9px]',
                        'flex-shrink-0'
                    ]" :style="{ backgroundColor: getHslBlockColor(hslBlock) }"
                        @click="emit('add-hsl-layer', hslBlock)" :title="hslBlock.name">
                        <span class="drop-shadow-md">{{ hslBlock.name }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Layers Section -->
        <div v-if="showList && layers.length > 0" class="layers-section mt-4 pt-4 border-t border-white/5">
            <h4 class="text-sm text-white/70 mb-2">调整图层 ({{ layers.length }})</h4>
            <div class="layers-list flex flex-col gap-1 max-h-[150px] overflow-y-auto">
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

        <!-- Layer Adjustment Panel -->
        <div v-if="showSettings && activeLayer"
            class="layer-adjustment-panel mt-3 p-3 bg-white/5 rounded border border-white/5">
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

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { getHslBlockColor } from '../../utils/lut/getHslBlockColor'
import type { AdjustmentLayer } from '../../composables/useColorBlockSelector'

interface ColorBlock {
    r: number
    g: number
    b: number
    count: number
}

interface HslBlock {
    name?: string
    hue: number
    hueTolerance: number
    saturation: number
    saturationTolerance: number
    lightness: number
    lightnessTolerance: number
    feather: number
}

interface Props {
    processing: boolean
    quantizedColorBlocks: ColorBlock[]
    commonHslBlocks: HslBlock[]
    layers: AdjustmentLayer[]
    activeLayerId: string | null
    mode?: 'full' | 'add-only' | 'settings-only' | 'list-only'
    isMobile?: boolean
}

interface Emits {
    (e: 'add-color-layer', color: ColorBlock): void
    (e: 'add-hsl-layer', hslBlock: HslBlock): void
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

// Slider items for common settings
const commonSliderItems = computed(() => {
    if (!activeLayer.value) return []
    return [
        {
            id: 'layer-intensity',
            label: '强度',
            value: activeLayer.value.intensity,
            min: 0,
            max: 1,
            step: 0.01,
            format: (val: number) => `${Math.round(val * 100)}%`
        }
    ]
})

// Slider items for HSL settings
const hslSliderItems = computed(() => {
    if (!activeLayer.value || !activeLayer.value.hslRange) return []
    const hsl = activeLayer.value.hslRange
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
    if (!activeLayer.value || activeLayer.value.type !== 'quantized') return []
    return [
        {
            id: 'quantized-tolerance',
            label: '颜色容差',
            value: activeLayer.value.tolerance || 0,
            min: 0,
            max: 100,
            step: 1
        }
    ]
})

const updateLayerVisible = (layer: AdjustmentLayer, event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update-layer', layer.id, { visible: target.checked })
}

const updateLayerBlendMode = (event: Event) => {
    if (!activeLayer.value) return
    const target = event.target as HTMLSelectElement
    emit('update-layer', activeLayer.value.id, { blendMode: target.value as any })
}

const handleSliderUpdate = (data: { id: string; value: number | string }) => {
    if (!activeLayer.value) return

    // Handle common settings
    if (data.id === 'layer-intensity') {
        emit('update-layer', activeLayer.value.id, { intensity: data.value as number })
    }
    // Handle HSL parameters
    else if (data.id.startsWith('hsl-') && activeLayer.value.hslRange) {
        const param = data.id.replace('hsl-', '')
        const newHslRange = { ...activeLayer.value.hslRange, [param]: data.value }
        emit('update-layer', activeLayer.value.id, { hslRange: newHslRange })
    }
    // Handle quantized parameters
    else if (data.id.startsWith('quantized-')) {
        const param = data.id.replace('quantized-', '')
        emit('update-layer', activeLayer.value.id, { [param]: data.value })
    }
}

</script>

<style scoped>
/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 移动端横向滚动优化 */
.color-blocks-container {
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
    /* iOS 平滑滚动 */
}
</style>
