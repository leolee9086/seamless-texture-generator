<template>
    <div class="flex flex-col gap-4">
        <!-- Image Inputs -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Input Images</span>
            </div>

            <!-- Image A -->
            <div class="flex flex-col gap-2">
                <label class="text-xs text-white/40">Image A (Base)</label>
                <label
                    class="glass-btn relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer h-20 flex items-center justify-center group">
                    <div v-if="!imageA" class="flex items-center gap-2 text-white/50">
                        <div class="i-carbon-image text-xl"></div>
                        <span class="text-xs">Select Image A</span>
                    </div>
                    <div v-else
                        class="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                        :style="{ backgroundImage: `url(${imageA})` }"></div>
                    <input type="file" accept="image/*" @change="handleImageAUpload" class="hidden" />
                </label>
            </div>

            <!-- Image B -->
            <div class="flex flex-col gap-2">
                <label class="text-xs text-white/40">Image B (Blend)</label>
                <label
                    class="glass-btn relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer h-20 flex items-center justify-center group">
                    <div v-if="!imageB" class="flex items-center gap-2 text-white/50">
                        <div class="i-carbon-image text-xl"></div>
                        <span class="text-xs">Select Image B</span>
                    </div>
                    <div v-else
                        class="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                        :style="{ backgroundImage: `url(${imageB})` }"></div>
                    <input type="file" accept="image/*" @change="handleImageBUpload" class="hidden" />
                </label>
            </div>

            <!-- Mask -->
            <div class="flex flex-col gap-2">
                <label class="text-xs text-white/40">Grayscale Mask</label>
                <label
                    class="glass-btn relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer h-20 flex items-center justify-center group">
                    <div v-if="!mask" class="flex items-center gap-2 text-white/50">
                        <div class="i-carbon-image text-xl"></div>
                        <span class="text-xs">Select Mask or Generate Turing</span>
                    </div>
                    <div v-else
                        class="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                        :style="{ backgroundImage: `url(${mask})` }"></div>
                    <input type="file" accept="image/*" @change="handleMaskUpload" class="hidden" />
                </label>
            </div>

            <!-- Quick Actions -->
            <div class="flex gap-2">
                <button @click="generateTuringMask" :disabled="isGeneratingMask"
                    class="glass-btn flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-xs font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <div v-if="isGeneratingMask" class="i-carbon-circle-dash animate-spin"></div>
                    <div v-else class="i-carbon-magic-wand"></div>
                    {{ isGeneratingMask ? 'Generating...' : 'Generate Turing Mask' }}
                </button>
            </div>
        </div>

        <!-- Mask Control Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Mask Control</span>
                <button @click="showMaskParams = !showMaskParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showMaskParams }"></div>
                </button>
            </div>
            <div v-show="showMaskParams" class="flex flex-col gap-3">
                <div v-for="param in maskSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Blend Control Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Blend Control</span>
                <button @click="showBlendParams = !showBlendParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showBlendParams }"></div>
                </button>
            </div>
            <div v-show="showBlendParams" class="flex flex-col gap-3">
                <!-- Blend Mode Selector -->
                <div class="flex flex-col gap-2">
                    <span class="text-xs text-white/40">Blend Mode</span>
                    <div class="grid grid-cols-2 gap-2">
                        <button v-for="mode in blendModes" :key="mode" @click="compositorParams.blendMode = mode"
                            class="glass-btn text-xs py-1.5 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors"
                            :class="compositorParams.blendMode === mode ? 'bg-white/10 text-white/90' : ''">
                            {{ mode }}
                        </button>
                    </div>
                </div>

                <!-- Opacity & Invert -->
                <div v-for="param in blendSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>

                <!-- Invert Toggle -->
                <div class="flex items-center justify-between py-2">
                    <span class="text-xs text-white/60">Invert Mask</span>
                    <button @click="compositorParams.invert = !compositorParams.invert"
                        class="glass-btn px-3 py-1.5 rounded-lg text-xs transition-all"
                        :class="compositorParams.invert ? 'bg-white/20 text-white/90' : 'bg-white/5 text-white/40'">
                        {{ compositorParams.invert ? 'ON' : 'OFF' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Presets -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Presets</span>
                <button @click="showPresets = !showPresets" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showPresets }"></div>
                </button>
            </div>
            <div v-show="showPresets" class="grid grid-cols-2 gap-2">
                <button v-for="(preset, name) in compositorPresets" :key="name" @click="applyPreset(preset)"
                    class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors">
                    {{ name }}
                </button>
            </div>
        </div>

        <!-- Generate Button -->
        <button @click="generateComposite" :disabled="!canGenerate || isGenerating"
            class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
            <div v-else class="i-carbon-checkbox-checked text-lg"></div>
            {{ isGenerating ? 'Compositing...' : 'Composite Images' }}
        </button>

        <div v-if="!canGenerate" class="text-xs text-center text-white/40">
            Please select all three images to continue
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import {
    compositeWithMask,
    defaultCompositorParams,
    compositorPresets as presets,
    type GrayscaleCompositorParams
} from '../../proceduralTexturing/other/GrayscaleCompositor/compositorGenerator'
import { generateFilmGradeTexture, defaultFilmParams } from '../../proceduralTexturing/other/GrayScottTuring/turingGenerator'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// UI State
const showMaskParams = ref(true)
const showBlendParams = ref(false)
const showPresets = ref(false)

// Image Sources
const imageA = ref<string | null>(null)
const imageB = ref<string | null>(null)
const mask = ref<string | null>(null)
const isGeneratingMask = ref(false)

// Compositor Parameters
const compositorParams = reactive<GrayscaleCompositorParams>({ ...defaultCompositorParams })

const blendModes = ['normal', 'multiply', 'screen', 'overlay'] as const

// Mask Control Sliders
const maskSliderItems = computed(() => [
    {
        id: 'threshold',
        label: 'Threshold',
        value: compositorParams.threshold,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'softness',
        label: 'Softness',
        value: compositorParams.softness,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'contrast',
        label: 'Contrast',
        value: compositorParams.contrast,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'maskBias',
        label: 'Bias',
        value: compositorParams.maskBias,
        min: -1.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'maskGamma',
        label: 'Gamma',
        value: compositorParams.maskGamma,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Blend Control Sliders
const blendSliderItems = computed(() => [
    {
        id: 'opacity',
        label: 'Opacity',
        value: compositorParams.opacity,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

const canGenerate = computed(() => {
    return imageA.value && imageB.value && mask.value
})

const handleParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in compositorParams) {
        (compositorParams as any)[data.id] = data.value
    }
}

const handleImageAUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            imageA.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

const handleImageBUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            imageB.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

const handleMaskUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            mask.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

const generateTuringMask = async () => {
    isGeneratingMask.value = true
    try {
        const maskData = await generateFilmGradeTexture(defaultFilmParams, 1024, 1024)
        mask.value = maskData
    } catch (error) {
        console.error('Failed to generate turing mask:', error)
    } finally {
        isGeneratingMask.value = false
    }
}

const applyPreset = (preset: GrayscaleCompositorParams) => {
    Object.assign(compositorParams, preset)
}

const localIsGenerating = ref(false)
const pendingGeneration = ref(false)

const generateComposite = async () => {
    if (!canGenerate.value) return

    if (localIsGenerating.value) {
        pendingGeneration.value = true
        return
    }

    localIsGenerating.value = true

    try {
        do {
            pendingGeneration.value = false
            const result = await compositeWithMask(
                imageA.value!,
                imageB.value!,
                mask.value!,
                compositorParams
            )
            emit('set-image', result)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to composite images:', error)
    } finally {
        localIsGenerating.value = false
    }
}

// Auto-generate on parameter change (debounced)
let debounceTimer: number | null = null
const debouncedGenerate = () => {
    if (!canGenerate.value) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        generateComposite()
    }, 300) as unknown as number
}

watch(compositorParams, () => {
    debouncedGenerate()
}, { deep: true })
</script>
