<template>
    <div class="input-group">
        <label class="text-white/80 text-sm font-medium mb-2 block">选择颜色范围:</label>
        <div class="color-blocks-container flex flex-col gap-4">
            <!-- Quantized Color Blocks -->
            <div v-if="quantizedColorBlocks.length > 0" class="color-block-section">
                <h4 class="text-xs text-white/60 font-bold mb-2">图像量化色块 (点击添加)</h4>
                <div class="color-blocks flex flex-wrap gap-1">
                    <div v-for="(color, index) in quantizedColorBlocks" :key="`quantized-${index}`"
                        class="color-block w-8 h-8 rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center text-[9px] font-bold text-white shadow-sm border-2 border-white/10 hover:scale-110 hover:shadow-md hover:z-10"
                        :style="{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }"
                        @click="emit('add-color-layer', color)"
                        :title="`RGB(${color.r}, ${color.g}, ${color.b}) - 出现${color.count}次`">
                        <span class="drop-shadow-md">{{ color.count }}</span>
                    </div>
                </div>
            </div>

            <!-- Common HSL Blocks -->
            <div class="color-block-section">
                <h4 class="text-xs text-white/60 font-bold mb-2">常用HSL色块 (点击添加)</h4>
                <div class="color-blocks flex flex-wrap gap-1">
                    <div v-for="(hslBlock, index) in commonHslBlocks" :key="`hsl-${index}`"
                        class="color-block hsl-block w-8 h-8 rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center text-[9px] font-bold text-white shadow-sm border border-white/10 hover:scale-110 hover:shadow-md hover:z-10 text-center leading-tight"
                        :style="{ backgroundColor: getHslBlockColor(hslBlock) }"
                        @click="emit('add-hsl-layer', hslBlock)" :title="hslBlock.name">
                        <span class="drop-shadow-md">{{ hslBlock.name }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Layers Section -->
        <div v-if="layers.length > 0" class="layers-section mt-4 pt-4 border-t border-white/5">
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
        <div v-if="activeLayer" class="layer-adjustment-panel mt-3 p-3 bg-white/5 rounded border border-white/5">
            <h4 class="text-xs text-white/80 mb-2 pb-2 border-b border-white/5">图层设置: {{ activeLayer.name }}</h4>

            <!-- Common Settings -->
            <div class="control-row flex items-center justify-between mb-2 text-xs">
                <label>强度: {{ Math.round(activeLayer.intensity * 100) }}%</label>
                <input type="range" min="0" max="1" step="0.01" :value="activeLayer.intensity"
                    @input="updateLayerIntensity" class="w-3/5" />
            </div>

            <div class="control-row flex items-center justify-between mb-2 text-xs">
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
                <div class="control-group mb-3 pb-2 border-b border-dashed border-white/5">
                    <label class="text-xs font-semibold text-blue-400 block mb-1">色相 (Hue)</label>
                    <div class="control-row flex items-center justify-between mb-1 text-xs">
                        <span>中心: {{ Math.round(activeLayer.hslRange.hue) }}°</span>
                        <input type="range" min="0" max="360" :value="activeLayer.hslRange.hue"
                            @input="updateHslParam('hue', $event)" class="w-3/5" />
                    </div>
                    <div class="control-row flex items-center justify-between mb-1 text-xs">
                        <span>容差: {{ Math.round(activeLayer.hslRange.hueTolerance) }}</span>
                        <input type="range" min="0" max="180" :value="activeLayer.hslRange.hueTolerance"
                            @input="updateHslParam('hueTolerance', $event)" class="w-3/5" />
                    </div>
                </div>

                <div class="control-group mb-3 pb-2 border-b border-dashed border-white/5">
                    <label class="text-xs font-semibold text-blue-400 block mb-1">饱和度 (Saturation)</label>
                    <div class="control-row flex items-center justify-between mb-1 text-xs">
                        <span>中心: {{ Math.round(activeLayer.hslRange.saturation) }}%</span>
                        <input type="range" min="0" max="100" :value="activeLayer.hslRange.saturation"
                            @input="updateHslParam('saturation', $event)" class="w-3/5" />
                    </div>
                    <div class="control-row flex items-center justify-between mb-1 text-xs">
                        <span>容差: {{ Math.round(activeLayer.hslRange.saturationTolerance) }}</span>
                        <input type="range" min="0" max="100" :value="activeLayer.hslRange.saturationTolerance"
                            @input="updateHslParam('saturationTolerance', $event)" class="w-3/5" />
                    </div>
                </div>

                <div class="control-group mb-3 pb-2 border-b border-dashed border-white/5">
                    <label class="text-xs font-semibold text-blue-400 block mb-1">明度 (Lightness)</label>
                    <div class="control-row flex items-center justify-between mb-1 text-xs">
                        <span>中心: {{ Math.round(activeLayer.hslRange.lightness) }}%</span>
                        <input type="range" min="0" max="100" :value="activeLayer.hslRange.lightness"
                            @input="updateHslParam('lightness', $event)" class="w-3/5" />
                    </div>
                    <div class="control-row flex items-center justify-between mb-1 text-xs">
                        <span>容差: {{ Math.round(activeLayer.hslRange.lightnessTolerance) }}</span>
                        <input type="range" min="0" max="100" :value="activeLayer.hslRange.lightnessTolerance"
                            @input="updateHslParam('lightnessTolerance', $event)" class="w-3/5" />
                    </div>
                </div>

                <div class="control-row flex items-center justify-between mb-1 text-xs">
                    <label>羽化: {{ activeLayer.hslRange.feather.toFixed(2) }}</label>
                    <input type="range" min="0" max="1" step="0.05" :value="activeLayer.hslRange.feather"
                        @input="updateHslParam('feather', $event)" class="w-3/5" />
                </div>
            </div>

            <!-- Quantized Color Settings -->
            <div v-if="activeLayer.type === 'quantized'" class="quantized-controls">
                <div class="control-row flex items-center justify-between mb-1 text-xs">
                    <label>颜色容差: {{ activeLayer.tolerance }}</label>
                    <input type="range" min="0" max="100" :value="activeLayer.tolerance"
                        @input="updateQuantizedParam('tolerance', $event)" class="w-3/5" />
                </div>
            </div>
        </div>

        <!-- Global Mask Options -->
        <div class="mask-options flex flex-col gap-2 mt-3 p-2 bg-black/20 rounded border border-white/5">
            <label class="checkbox-label flex items-center cursor-pointer text-xs text-white/80">
                <input type="checkbox" :checked="maskOptions.smooth" @change="updateMaskOptionsSmooth"
                    :disabled="processing"
                    class="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                平滑遮罩边缘
            </label>
            <label class="checkbox-label flex items-center cursor-pointer text-xs text-white/80">
                <input type="checkbox" :checked="maskOptions.invert" @change="updateMaskOptionsInvert"
                    :disabled="processing"
                    class="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                反转最终遮罩
            </label>
        </div>

        <!-- Mask Preview -->
        <div v-if="layers.length > 0" class="mask-preview mt-3 border-t border-white/5 pt-3">
            <h4 class="text-xs text-white/70 mb-2">蒙版预览</h4>
            <div
                class="canvas-container flex justify-center items-center bg-black/20 rounded border border-white/10 p-2">
                <canvas ref="maskPreviewCanvasRef" class="max-w-full rounded border-2 border-red-500/30"></canvas>
            </div>
            <div class="text-[10px] text-white/50 text-center mt-1">半透明红色区域 = LUT应用区域</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

interface MaskOptions {
    smooth: boolean
    invert: boolean
}

interface Props {
    processing: boolean
    quantizedColorBlocks: ColorBlock[]
    commonHslBlocks: HslBlock[]
    layers: AdjustmentLayer[]
    activeLayerId: string | null
    maskOptions: MaskOptions
}

interface Emits {
    (e: 'add-color-layer', color: ColorBlock): void
    (e: 'add-hsl-layer', hslBlock: HslBlock): void
    (e: 'remove-layer', id: string): void
    (e: 'select-layer', id: string): void
    (e: 'update-layer', id: string, updates: Partial<AdjustmentLayer>): void
    (e: 'update:maskOptions', options: MaskOptions): void
    (e: 'request-mask-preview-update', canvas?: HTMLCanvasElement): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeLayer = computed(() => {
    return props.layers.find(l => l.id === props.activeLayerId)
})

const updateLayerVisible = (layer: AdjustmentLayer, event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update-layer', layer.id, { visible: target.checked })
}

const updateLayerIntensity = (event: Event) => {
    if (!activeLayer.value) return
    const target = event.target as HTMLInputElement
    emit('update-layer', activeLayer.value.id, { intensity: parseFloat(target.value) })
}

const updateLayerBlendMode = (event: Event) => {
    if (!activeLayer.value) return
    const target = event.target as HTMLSelectElement
    emit('update-layer', activeLayer.value.id, { blendMode: target.value as any })
}

const updateHslParam = (param: string, event: Event) => {
    if (!activeLayer.value || !activeLayer.value.hslRange) return
    const target = event.target as HTMLInputElement
    const value = parseFloat(target.value)

    const newHslRange = { ...activeLayer.value.hslRange, [param]: value }
    emit('update-layer', activeLayer.value.id, { hslRange: newHslRange })
}

const updateQuantizedParam = (param: string, event: Event) => {
    if (!activeLayer.value) return
    const target = event.target as HTMLInputElement
    const value = parseFloat(target.value)

    emit('update-layer', activeLayer.value.id, { [param]: value })
}

const updateMaskOptionsSmooth = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:maskOptions', { ...props.maskOptions, smooth: target.checked })
}

const updateMaskOptionsInvert = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:maskOptions', { ...props.maskOptions, invert: target.checked })
}

// Mask preview canvas ref
const maskPreviewCanvasRef = ref<HTMLCanvasElement>()

// Watch for layers or mask options changes and notify parent
watch([() => props.layers, () => props.maskOptions], () => {
    // Emit event to trigger mask preview update in parent
    if (props.layers.length > 0) {
        emit('request-mask-preview-update', maskPreviewCanvasRef.value)
    }
}, { deep: true })
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>
