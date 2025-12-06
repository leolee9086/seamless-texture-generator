<template>
    <div class="flex flex-col gap-4">
        <!-- Color Controls -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Colors (Gradient)</span>
                <button @click="state.uiState.woodPanel.showColors = !state.uiState.woodPanel.showColors" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.woodPanel.showColors }"></div>
                </button>
            </div>
            <div v-show="state.uiState.woodPanel.showColors" class="flex flex-col gap-3">
                <GradientEditor v-model="state.woodParams.gradientStops" />
            </div>
        </div>

        <!-- Basic Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Basic Parameters</span>
                <button @click="state.uiState.woodPanel.showBasicParams = !state.uiState.woodPanel.showBasicParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.woodPanel.showBasicParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.woodPanel.showBasicParams" class="flex flex-col gap-3">
                <div v-for="param in basicWoodSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Pore Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Pore Parameters</span>
                <button @click="state.uiState.woodPanel.showPoreParams = !state.uiState.woodPanel.showPoreParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.woodPanel.showPoreParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.woodPanel.showPoreParams" class="flex flex-col gap-3">
                <div v-for="param in poreWoodSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Advanced Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Advanced Parameters</span>
                <button @click="state.uiState.woodPanel.showAdvancedParams = !state.uiState.woodPanel.showAdvancedParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.woodPanel.showAdvancedParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.woodPanel.showAdvancedParams" class="flex flex-col gap-3">
                <div v-for="param in advancedWoodSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Material Properties -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Material Properties</span>
                <button @click="state.uiState.woodPanel.showMaterialParams = !state.uiState.woodPanel.showMaterialParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.woodPanel.showMaterialParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.woodPanel.showMaterialParams" class="flex flex-col gap-3">
                <div v-for="param in materialWoodSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Presets -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Presets</span>
                <button @click="state.uiState.woodPanel.showPresets = !state.uiState.woodPanel.showPresets" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.woodPanel.showPresets }"></div>
                </button>
            </div>
            <div v-show="state.uiState.woodPanel.showPresets" class="grid grid-cols-2 gap-2">
                <button v-for="(preset, name) in woodPresets" :key="name" @click="applyPreset(preset)"
                    class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors">
                    {{ name }}
                </button>
            </div>
        </div>

        <button @click="generateWood" :disabled="isGenerating"
            class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
            <div v-else class="i-carbon-magic-wand text-lg"></div>
            {{ isGenerating ? 'Generating...' : 'Generate Wood Texture' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import GradientEditor from '../gradient/GradientEditor.vue'
import { generateWoodTexture, type WoodParams } from '../../proceduralTexturing/wood/woodGeneratorPipeline'
import { useProceduralTextureState } from '../../composables/useProceduralTextureState'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// 使用持久化状态管理
const { state } = useProceduralTextureState()

// Basic Parameters
const basicWoodSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: state.woodParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ringScale',
        label: 'Ring Scale',
        value: state.woodParams.ringScale,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ringDistortion',
        label: 'Distortion',
        value: state.woodParams.ringDistortion,
        min: 0.0,
        max: 3.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotIntensity',
        label: 'Knots',
        value: state.woodParams.knotIntensity,
        min: 0.0,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'latewoodBias',
        label: 'Sharpness',
        value: state.woodParams.latewoodBias,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'rayStrength',
        label: 'Rays',
        value: state.woodParams.rayStrength,
        min: 0.0,
        max: 10.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreDensity',
        label: 'Pores',
        value: state.woodParams.poreDensity,
        min: 0.0,
        max: 150.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Advanced Parameters
const advancedWoodSliderItems = computed(() => [
    {
        id: 'fbmOctaves',
        label: 'FBM Octaves',
        value: state.woodParams.fbmOctaves,
        min: 1,
        max: 5,
        step: 1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fbmAmplitude',
        label: 'FBM Amplitude',
        value: state.woodParams.fbmAmplitude,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotFrequency',
        label: 'Knot Frequency',
        value: state.woodParams.knotFrequency,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'distortionFreq',
        label: 'Distortion Frequency',
        value: state.woodParams.distortionFreq,
        min: 1.0,
        max: 3.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ringNoiseFreq',
        label: 'Ring Noise Frequency',
        value: state.woodParams.ringNoiseFreq,
        min: 3.0,
        max: 10.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'rayFrequencyX',
        label: 'Ray Frequency X',
        value: state.woodParams.rayFrequencyX,
        min: 10.0,
        max: 300.0,
        step: 5.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'rayFrequencyY',
        label: 'Ray Frequency Y',
        value: state.woodParams.rayFrequencyY,
        min: 1.0,
        max: 50.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotThresholdMin',
        label: 'Knot Threshold Min',
        value: state.woodParams.knotThresholdMin,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotThresholdMax',
        label: 'Knot Threshold Max',
        value: state.woodParams.knotThresholdMax,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Pore Parameters
const poreWoodSliderItems = computed(() => [
    {
        id: 'poreScale',
        label: 'Pore Size',
        value: state.woodParams.poreScale,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreThresholdEarly',
        label: 'Early Wood Threshold',
        value: state.woodParams.poreThresholdEarly,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreThresholdLate',
        label: 'Late Wood Threshold',
        value: state.woodParams.poreThresholdLate,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreThresholdRange',
        label: 'Threshold Range',
        value: state.woodParams.poreThresholdRange,
        min: 0.05,
        max: 0.5,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreStrength',
        label: 'Pore Strength',
        value: state.woodParams.poreStrength,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Material Properties
const materialWoodSliderItems = computed(() => [
    {
        id: 'normalStrength',
        label: 'Normal Strength',
        value: state.woodParams.normalStrength,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMin',
        label: 'Min Roughness',
        value: state.woodParams.roughnessMin,
        min: 0.1,
        max: 0.5,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMax',
        label: 'Max Roughness',
        value: state.woodParams.roughnessMax,
        min: 0.5,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Wood Presets
const woodPresets = {
    'Pine': {
        tileSize: 1.0,
        ringScale: 5.0,
        ringDistortion: 0.8,
        knotIntensity: 1.2,
        latewoodBias: 0.5,
        rayStrength: 0.1,
        poreDensity: 0.0,
        gradientStops: [
            { offset: 0.0, color: '#A6734D' },
            { offset: 1.0, color: '#EBD9AD' }
        ],
        fbmOctaves: 3,
        fbmAmplitude: 0.5,
        knotFrequency: 0.8,
        distortionFreq: 1.2,
        ringNoiseFreq: 4.0,
        rayFrequencyX: 40.0,
        rayFrequencyY: 1.5,
        knotThresholdMin: 0.4,
        knotThresholdMax: 0.8,
        normalStrength: 6.0,
        roughnessMin: 0.4,
        roughnessMax: 0.8,
        poreScale: 0.8,
        poreThresholdEarly: 0.6,
        poreThresholdLate: 0.75,
        poreThresholdRange: 0.2,
        poreStrength: 0.12,
    },
    'White Oak': {
        tileSize: 1.0,
        ringScale: 12.0,
        ringDistortion: 1.2,
        knotIntensity: 0.8,
        latewoodBias: 3.0,
        rayStrength: 0.8,
        poreDensity: 20.0,
        gradientStops: [
            { offset: 0.0, color: '#735940' },
            { offset: 1.0, color: '#DBC7A6' }
        ],
        fbmOctaves: 4,
        fbmAmplitude: 0.6,
        knotFrequency: 1.0,
        distortionFreq: 1.8,
        ringNoiseFreq: 6.0,
        rayFrequencyX: 60.0,
        rayFrequencyY: 2.5,
        knotThresholdMin: 0.3,
        knotThresholdMax: 0.7,
        normalStrength: 10.0,
        roughnessMin: 0.3,
        roughnessMax: 0.7,
        poreScale: 1.0,
        poreThresholdEarly: 0.55,
        poreThresholdLate: 0.7,
        poreThresholdRange: 0.2,
        poreStrength: 0.16,
    },
    'Walnut': {
        tileSize: 1.0,
        ringScale: 8.0,
        ringDistortion: 1.5,
        knotIntensity: 1.0,
        latewoodBias: 1.5,
        rayStrength: 0.3,
        poreDensity: 5.0,
        gradientStops: [
            { offset: 0.0, color: '#40261A' },
            { offset: 1.0, color: '#8C6640' }
        ],
        fbmOctaves: 3,
        fbmAmplitude: 0.7,
        knotFrequency: 1.2,
        distortionFreq: 2.0,
        ringNoiseFreq: 5.0,
        rayFrequencyX: 45.0,
        rayFrequencyY: 2.0,
        knotThresholdMin: 0.5,
        knotThresholdMax: 0.9,
        normalStrength: 8.0,
        roughnessMin: 0.35,
        roughnessMax: 0.65,
        poreScale: 0.6,
        poreThresholdEarly: 0.65,
        poreThresholdLate: 0.75,
        poreThresholdRange: 0.15,
        poreStrength: 0.10,
    }
}

const handleWoodParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in state.woodParams) {
        (state.woodParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<WoodParams>) => {
    Object.assign(state.woodParams, preset)
}

const pendingGeneration = ref(false)
const localIsGenerating = ref(false)

const generateWood = async () => {
    if (localIsGenerating.value) {
        pendingGeneration.value = true
        return
    }

    localIsGenerating.value = true

    try {
        do {
            pendingGeneration.value = false
            const imageData = await generateWoodTexture(state.woodParams, 1024, 1024)
            emit('set-image', imageData)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to generate wood texture:', error)
    } finally {
        localIsGenerating.value = false
    }
}

let debounceTimer: number | null = null
const debouncedGenerateWood = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        generateWood()
    }, 50) as unknown as number
}

watch(state.woodParams, () => {
    debouncedGenerateWood()
}, { deep: true })
</script>
