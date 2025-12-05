<template>
    <div class="flex flex-col gap-4">
        <!-- Color Controls -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Colors (Gradient)</span>
                <button @click="showColors = !showColors" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showColors }"></div>
                </button>
            </div>
            <div v-show="showColors" class="flex flex-col gap-3">
                <GradientEditor v-model="weaveParams.gradientStops" />
            </div>
        </div>

        <!-- Basic Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Basic Parameters</span>
                <button @click="showBasicParams = !showBasicParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showBasicParams }"></div>
                </button>
            </div>
            <div v-show="showBasicParams" class="flex flex-col gap-3">
                <div v-for="param in basicWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Twill Specific Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Twill Pattern</span>
                <button @click="showTwillParams = !showTwillParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showTwillParams }"></div>
                </button>
            </div>
            <div v-show="showTwillParams" class="flex flex-col gap-3">
                <div v-for="param in twillWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Thread Structure -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Thread Structure</span>
                <button @click="showThreadParams = !showThreadParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showThreadParams }"></div>
                </button>
            </div>
            <div v-show="showThreadParams" class="flex flex-col gap-3">
                <div v-for="param in threadWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Advanced Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Advanced Parameters</span>
                <button @click="showAdvancedParams = !showAdvancedParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showAdvancedParams }"></div>
                </button>
            </div>
            <div v-show="showAdvancedParams" class="flex flex-col gap-3">
                <div v-for="param in advancedWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Material Properties -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Material Properties</span>
                <button @click="showMaterialParams = !showMaterialParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showMaterialParams }"></div>
                </button>
            </div>
            <div v-show="showMaterialParams" class="flex flex-col gap-3">
                <div v-for="param in materialWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
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
                <button v-for="(preset, name) in weavePresets" :key="name" @click="applyPreset(preset)"
                    class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors">
                    {{ name }}
                </button>
            </div>
        </div>

        <button @click="generateWeave" :disabled="isGenerating"
            class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
            <div v-else class="i-carbon-magic-wand text-lg"></div>
            {{ isGenerating ? 'Generating...' : 'Generate Twill Fabric' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import GradientEditor from '../gradient/GradientEditor.vue'
import { generateTwillWeaveTexture, defaultTwillWeaveParams } from '../../proceduralTexturing/fabrics/twillWeave/twillWeaveGenerator'
import type { TwillWeaveParams } from '../../proceduralTexturing/fabrics/twillWeave/twillWeave'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// UI State
const showColors = ref(true)
const showBasicParams = ref(true)
const showTwillParams = ref(true)
const showThreadParams = ref(false)
const showAdvancedParams = ref(false)
const showMaterialParams = ref(false)
const showPresets = ref(false)

// Twill Weave Parameters State
const weaveParams = reactive<TwillWeaveParams>({ ...defaultTwillWeaveParams })

// Basic Weave Parameters
const basicWeaveSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: weaveParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadDensity',
        label: 'Thread Density',
        value: weaveParams.threadDensity,
        min: 5.0,
        max: 50.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadThickness',
        label: 'Thread Thickness',
        value: weaveParams.threadThickness,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'warpWeftRatio',
        label: 'Warp/Weft Ratio',
        value: weaveParams.warpWeftRatio,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Twill Specific Parameters
const twillWeaveSliderItems = computed(() => [
    {
        id: 'twillRepeat',
        label: 'Twill Repeat',
        value: weaveParams.twillRepeat,
        min: 2.0,
        max: 8.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'herringboneScale',
        label: 'Herringbone Scale',
        value: weaveParams.herringboneScale,
        min: 0.0,
        max: 20.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'waleDepth',
        label: 'Wale Depth',
        value: weaveParams.waleDepth,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Thread Structure Parameters
const threadWeaveSliderItems = computed(() => [
    {
        id: 'threadTwist',
        label: 'Thread Twist',
        value: weaveParams.threadTwist,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fiberDetail',
        label: 'Fiber Detail',
        value: weaveParams.fiberDetail,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fuzziness',
        label: 'Fuzziness',
        value: weaveParams.fuzziness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'weaveTightness',
        label: 'Weave Tightness',
        value: weaveParams.weaveTightness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadUnevenness',
        label: 'Thread Unevenness',
        value: weaveParams.threadUnevenness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'weaveImperfection',
        label: 'Weave Imperfection',
        value: weaveParams.weaveImperfection,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Advanced Weave Parameters
const advancedWeaveSliderItems = computed(() => [
    {
        id: 'fbmOctaves',
        label: 'FBM Octaves',
        value: weaveParams.fbmOctaves,
        min: 1,
        max: 5,
        step: 1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fbmAmplitude',
        label: 'FBM Amplitude',
        value: weaveParams.fbmAmplitude,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'noiseFrequency',
        label: 'Noise Frequency',
        value: weaveParams.noiseFrequency,
        min: 1.0,
        max: 10.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'colorVariation',
        label: 'Color Variation',
        value: weaveParams.colorVariation,
        min: 0.0,
        max: 0.2,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadHeightScale',
        label: 'Thread Height Scale',
        value: weaveParams.threadHeightScale,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadShadowStrength',
        label: 'Thread Shadow',
        value: weaveParams.threadShadowStrength,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Material Weave Parameters
const materialWeaveSliderItems = computed(() => [
    {
        id: 'warpSheen',
        label: 'Warp Sheen',
        value: weaveParams.warpSheen,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'weftSheen',
        label: 'Weft Sheen',
        value: weaveParams.weftSheen,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'normalStrength',
        label: 'Normal Strength',
        value: weaveParams.normalStrength,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMin',
        label: 'Min Roughness',
        value: weaveParams.roughnessMin,
        min: 0.3,
        max: 0.7,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMax',
        label: 'Max Roughness',
        value: weaveParams.roughnessMax,
        min: 0.7,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Twill Weave Presets
const weavePresets = {
    'Denim': {
        threadDensity: 40.0,
        threadThickness: 0.8,
        warpWeftRatio: 1.0,
        threadTwist: 0.7,
        fiberDetail: 0.4,
        fuzziness: 0.3,
        twillRepeat: 4.0,
        herringboneScale: 0.0,
        waleDepth: 1.2,
        weaveTightness: 0.85,
        threadUnevenness: 0.2,
        weaveImperfection: 0.15,
        gradientStops: [
            { offset: 0.0, color: '#1a1a2e' },
            { offset: 0.3, color: '#e0e0d0' },
            { offset: 0.6, color: '#2c3e50' },
            { offset: 1.0, color: '#34495e' }
        ],
        fbmOctaves: 4,
        fbmAmplitude: 0.4,
        noiseFrequency: 3.0,
        colorVariation: 0.15,
        warpSheen: 0.4,
        weftSheen: 0.1,
        roughnessMin: 0.5,
        roughnessMax: 0.9,
        normalStrength: 8.0,
        threadHeightScale: 1.2,
        threadShadowStrength: 0.6
    },
    'Herringbone': {
        threadDensity: 35.0,
        threadThickness: 0.7,
        warpWeftRatio: 1.0,
        threadTwist: 0.6,
        fiberDetail: 0.3,
        fuzziness: 0.2,
        twillRepeat: 4.0,
        herringboneScale: 10.0,
        waleDepth: 1.0,
        weaveTightness: 0.8,
        threadUnevenness: 0.15,
        weaveImperfection: 0.1,
        gradientStops: [
            { offset: 0.0, color: '#3a3a4a' },
            { offset: 0.3, color: '#d0d0c0' },
            { offset: 0.6, color: '#4a5a6a' },
            { offset: 1.0, color: '#5a6a7a' }
        ],
        fbmOctaves: 3,
        fbmAmplitude: 0.3,
        noiseFrequency: 2.5,
        colorVariation: 0.1,
        warpSheen: 0.3,
        weftSheen: 0.2,
        roughnessMin: 0.4,
        roughnessMax: 0.8,
        normalStrength: 6.0,
        threadHeightScale: 1.0,
        threadShadowStrength: 0.5
    },
    'Gabardine': {
        threadDensity: 45.0,
        threadThickness: 0.6,
        warpWeftRatio: 1.2,
        threadTwist: 0.8,
        fiberDetail: 0.2,
        fuzziness: 0.1,
        twillRepeat: 3.0,
        herringboneScale: 0.0,
        waleDepth: 0.8,
        weaveTightness: 0.9,
        threadUnevenness: 0.1,
        weaveImperfection: 0.05,
        gradientStops: [
            { offset: 0.0, color: '#2a2a3a' },
            { offset: 0.3, color: '#c0c0b0' },
            { offset: 0.6, color: '#3a4a5a' },
            { offset: 1.0, color: '#4a5a6a' }
        ],
        fbmOctaves: 2,
        fbmAmplitude: 0.2,
        noiseFrequency: 2.0,
        colorVariation: 0.08,
        warpSheen: 0.5,
        weftSheen: 0.3,
        roughnessMin: 0.3,
        roughnessMax: 0.7,
        normalStrength: 5.0,
        threadHeightScale: 0.8,
        threadShadowStrength: 0.4
    },
    'Cavalry Twill': {
        threadDensity: 30.0,
        threadThickness: 0.75,
        warpWeftRatio: 1.1,
        threadTwist: 0.65,
        fiberDetail: 0.35,
        fuzziness: 0.25,
        twillRepeat: 6.0,
        herringboneScale: 0.0,
        waleDepth: 1.5,
        weaveTightness: 0.75,
        threadUnevenness: 0.18,
        weaveImperfection: 0.12,
        gradientStops: [
            { offset: 0.0, color: '#4a4a5a' },
            { offset: 0.3, color: '#e8e8d8' },
            { offset: 0.6, color: '#5a6a7a' },
            { offset: 1.0, color: '#6a7a8a' }
        ],
        fbmOctaves: 4,
        fbmAmplitude: 0.35,
        noiseFrequency: 2.8,
        colorVariation: 0.12,
        warpSheen: 0.35,
        weftSheen: 0.25,
        roughnessMin: 0.45,
        roughnessMax: 0.85,
        normalStrength: 7.0,
        threadHeightScale: 1.1,
        threadShadowStrength: 0.55
    }
}

const handleWeaveParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in weaveParams) {
        (weaveParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<TwillWeaveParams>) => {
    Object.assign(weaveParams, preset)
}

const pendingGeneration = ref(false)
const localIsGenerating = ref(false)

const generateWeave = async () => {
    if (localIsGenerating.value) {
        pendingGeneration.value = true
        return
    }

    localIsGenerating.value = true

    try {
        do {
            pendingGeneration.value = false
            const imageData = await generateTwillWeaveTexture(weaveParams, 1024, 1024)
            emit('set-image', imageData)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to generate twill weave texture:', error)
    } finally {
        localIsGenerating.value = false
    }
}

let debounceTimer: number | null = null
const debouncedGenerateWeave = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        generateWeave()
    }, 50) as unknown as number
}

watch(weaveParams, () => {
    debouncedGenerateWeave()
}, { deep: true })
</script>