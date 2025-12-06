<template>
    <div class="flex flex-col gap-4">
        <!-- Color Controls -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Colors (Gradient)</span>
                <button @click="state.uiState.plainWeavePanel.showColors = !state.uiState.plainWeavePanel.showColors" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.plainWeavePanel.showColors }"></div>
                </button>
            </div>
            <div v-show="state.uiState.plainWeavePanel.showColors" class="flex flex-col gap-3">
                <GradientEditor v-model="state.plainWeaveParams.gradientStops" />
            </div>
        </div>

        <!-- Basic Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Basic Parameters</span>
                <button @click="state.uiState.plainWeavePanel.showBasicParams = !state.uiState.plainWeavePanel.showBasicParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.plainWeavePanel.showBasicParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.plainWeavePanel.showBasicParams" class="flex flex-col gap-3">
                <div v-for="param in basicWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Thread Structure -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Thread Structure</span>
                <button @click="state.uiState.plainWeavePanel.showThreadParams = !state.uiState.plainWeavePanel.showThreadParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.plainWeavePanel.showThreadParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.plainWeavePanel.showThreadParams" class="flex flex-col gap-3">
                <div v-for="param in threadWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Advanced Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Advanced Parameters</span>
                <button @click="state.uiState.plainWeavePanel.showAdvancedParams = !state.uiState.plainWeavePanel.showAdvancedParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.plainWeavePanel.showAdvancedParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.plainWeavePanel.showAdvancedParams" class="flex flex-col gap-3">
                <div v-for="param in advancedWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Material Properties -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Material Properties</span>
                <button @click="state.uiState.plainWeavePanel.showMaterialParams = !state.uiState.plainWeavePanel.showMaterialParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.plainWeavePanel.showMaterialParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.plainWeavePanel.showMaterialParams" class="flex flex-col gap-3">
                <div v-for="param in materialWeaveSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWeaveParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Presets -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Presets</span>
                <button @click="state.uiState.plainWeavePanel.showPresets = !state.uiState.plainWeavePanel.showPresets" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.plainWeavePanel.showPresets }"></div>
                </button>
            </div>
            <div v-show="state.uiState.plainWeavePanel.showPresets" class="grid grid-cols-2 gap-2">
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
            {{ isGenerating ? 'Generating...' : 'Generate Fabric Texture' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import GradientEditor from '../gradient/GradientEditor.vue'
import { generatePlainWeaveTexture } from '../../proceduralTexturing/fabrics/plainWeave/plainWeaveGenerator'
import { useProceduralTextureState } from '../../composables/useProceduralTextureState'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// 使用持久化状态管理
const { state } = useProceduralTextureState()

// Basic Weave Parameters
const basicWeaveSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: state.plainWeaveParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadDensity',
        label: 'Thread Density',
        value: state.plainWeaveParams.threadDensity,
        min: 5.0,
        max: 50.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadThickness',
        label: 'Thread Thickness',
        value: state.plainWeaveParams.threadThickness,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'warpWeftRatio',
        label: 'Warp/Weft Ratio',
        value: state.plainWeaveParams.warpWeftRatio,
        min: 0.5,
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
        value: state.plainWeaveParams.threadTwist,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fiberDetail',
        label: 'Fiber Detail',
        value: state.plainWeaveParams.fiberDetail,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fuzziness',
        label: 'Fuzziness',
        value: state.plainWeaveParams.fuzziness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'weaveTightness',
        label: 'Weave Tightness',
        value: state.plainWeaveParams.weaveTightness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadUnevenness',
        label: 'Thread Unevenness',
        value: state.plainWeaveParams.threadUnevenness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'weaveImperfection',
        label: 'Weave Imperfection',
        value: state.plainWeaveParams.weaveImperfection,
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
        value: state.plainWeaveParams.fbmOctaves,
        min: 1,
        max: 5,
        step: 1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fbmAmplitude',
        label: 'FBM Amplitude',
        value: state.plainWeaveParams.fbmAmplitude,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'noiseFrequency',
        label: 'Noise Frequency',
        value: state.plainWeaveParams.noiseFrequency,
        min: 1.0,
        max: 10.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'colorVariation',
        label: 'Color Variation',
        value: state.plainWeaveParams.colorVariation,
        min: 0.0,
        max: 0.2,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadHeightScale',
        label: 'Thread Height Scale',
        value: state.plainWeaveParams.threadHeightScale,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'threadShadowStrength',
        label: 'Thread Shadow',
        value: state.plainWeaveParams.threadShadowStrength,
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
        value: state.plainWeaveParams.warpSheen,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'weftSheen',
        label: 'Weft Sheen',
        value: state.plainWeaveParams.weftSheen,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'normalStrength',
        label: 'Normal Strength',
        value: state.plainWeaveParams.normalStrength,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMin',
        label: 'Min Roughness',
        value: state.plainWeaveParams.roughnessMin,
        min: 0.3,
        max: 0.7,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMax',
        label: 'Max Roughness',
        value: state.plainWeaveParams.roughnessMax,
        min: 0.7,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Weave Presets
const weavePresets = {
    'Cotton': {
        threadDensity: 20.0,
        threadThickness: 0.45,
        warpWeftRatio: 1.0,
        threadTwist: 0.5,
        fiberDetail: 0.3,
        fuzziness: 0.2,
        weaveTightness: 0.7,
        threadUnevenness: 0.15,
        weaveImperfection: 0.1,
        gradientStops: [
            { offset: 0.0, color: '#D4C8B8' },
            { offset: 1.0, color: '#F0E8DC' }
        ],
        warpSheen: 0.3,
        weftSheen: 0.25
    },
    'Linen': {
        threadDensity: 15.0,
        threadThickness: 0.55,
        warpWeftRatio: 1.1, threadTwist: 0.3,
        fiberDetail: 0.5,
        fuzziness: 0.1,
        weaveTightness: 0.6,
        threadUnevenness: 0.25,
        weaveImperfection: 0.2,
        gradientStops: [
            { offset: 0.0, color: '#B8AE9C' },
            { offset: 1.0, color: '#E8E0D0' }
        ],
        warpSheen: 0.4,
        weftSheen: 0.35
    },
    'Silk': {
        threadDensity: 30.0,
        threadThickness: 0.25,
        warpWeftRatio: 1.0,
        threadTwist: 0.7,
        fiberDetail: 0.1,
        fuzziness: 0.0,
        weaveTightness: 0.9,
        threadUnevenness: 0.05,
        weaveImperfection: 0.05,
        gradientStops: [
            { offset: 0.0, color: '#E8D8C8' },
            { offset: 1.0, color: '#FFF8F0' }
        ],
        warpSheen: 0.8,
        weftSheen: 0.75
    },
    'Canvas': {
        threadDensity: 12.0,
        threadThickness: 0.7,
        warpWeftRatio: 1.0,
        threadTwist: 0.4,
        fiberDetail: 0.4,
        fuzziness: 0.3,
        weaveTightness: 0.8,
        threadUnevenness: 0.2,
        weaveImperfection: 0.15,
        gradientStops: [
            { offset: 0.0, color: '#A89880' },
            { offset: 1.0, color: '#D8D0C0' }
        ],
        warpSheen: 0.1,
        weftSheen: 0.1
    }
}

const handleWeaveParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in state.plainWeaveParams) {
        (state.plainWeaveParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<any>) => {
    Object.assign(state.plainWeaveParams, preset)
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
            const imageData = await generatePlainWeaveTexture(state.plainWeaveParams, 1024, 1024)
            emit('set-image', imageData)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to generate weave texture:', error)
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

watch(state.plainWeaveParams, () => {
    debouncedGenerateWeave()
}, { deep: true })
</script>
