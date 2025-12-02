<template>
    <div class="input-group">
        <label class="text-white/80 text-sm font-medium mb-2 block">Select Color Range:</label>
        <div class="color-blocks-container flex flex-col gap-4">
            <!-- Quantized Color Blocks -->
            <div v-if="quantizedColorBlocks.length > 0" class="color-block-section">
                <h4 class="text-xs text-white/60 font-bold mb-2">Image Colors ({{ quantizedColorBlocks.length }})</h4>
                <div class="color-blocks flex flex-wrap gap-1">
                    <div v-for="(color, index) in quantizedColorBlocks" :key="`quantized-${index}`"
                        class="color-block w-8 h-8 rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center text-[9px] font-bold text-white shadow-sm border-2 border-white/10 hover:scale-110 hover:shadow-md hover:z-10"
                        :class="{ 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.35)]': selectedColorBlocks.includes(`quantized-${index}`) }"
                        :style="{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }"
                        @click="toggleColorBlock(`quantized-${index}`, color)"
                        :title="`RGB(${color.r}, ${color.g}, ${color.b}) - Count: ${color.count}`">
                        <span class="drop-shadow-md">{{ color.count }}</span>
                    </div>
                </div>
            </div>

            <!-- Common HSL Blocks -->
            <div class="color-block-section">
                <h4 class="text-xs text-white/60 font-bold mb-2">Common HSL Ranges</h4>
                <div class="color-blocks flex flex-wrap gap-1">
                    <div v-for="(hslBlock, index) in commonHslBlocks" :key="`hsl-${index}`"
                        class="color-block hsl-block w-8 h-8 rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center text-[9px] font-bold text-white shadow-sm border border-white/10 hover:scale-110 hover:shadow-md hover:z-10 text-center leading-tight"
                        :class="{ 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.35)]': selectedColorBlocks.includes(`hsl-${index}`) }"
                        :style="{ backgroundColor: getHslBlockColor(hslBlock) }"
                        @click="toggleHslBlock(`hsl-${index}`, hslBlock)" :title="hslBlock.name">
                        <span class="drop-shadow-md">{{ hslBlock.name }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="mask-options flex flex-col gap-2 mt-3 p-2 bg-black/20 rounded border border-white/5">
            <label class="checkbox-label flex items-center cursor-pointer text-xs text-white/80">
                <input type="checkbox" :checked="maskOptions.smooth" @change="updateMaskOptionsSmooth"
                    :disabled="processing"
                    class="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                Smooth Edges
            </label>
            <label class="checkbox-label flex items-center cursor-pointer text-xs text-white/80">
                <input type="checkbox" :checked="maskOptions.invert" @change="updateMaskOptionsInvert"
                    :disabled="processing"
                    class="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                Invert Mask
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getHslBlockColor } from '../../utils/lut/getHslBlockColor'

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
    selectedColorBlocks: string[]
    maskOptions: MaskOptions
}

interface Emits {
    (e: 'toggle-color-block', id: string, color: ColorBlock): void
    (e: 'toggle-hsl-block', id: string, hslBlock: HslBlock): void
    (e: 'update:maskOptions', options: MaskOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toggleColorBlock = (id: string, color: ColorBlock) => {
    emit('toggle-color-block', id, color)
}

const toggleHslBlock = (id: string, hslBlock: HslBlock) => {
    emit('toggle-hsl-block', id, hslBlock)
}

const updateMaskOptionsSmooth = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:maskOptions', { ...props.maskOptions, smooth: target.checked })
}

const updateMaskOptionsInvert = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:maskOptions', { ...props.maskOptions, invert: target.checked })
}
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>
