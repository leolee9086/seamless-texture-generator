<template>
    <div class="flex flex-col gap-4">
        <!-- Color Controls -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Colors</span>
                <button @click="state.uiState.velvetPanel.showColors = !state.uiState.velvetPanel.showColors" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showColors }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showColors" class="flex flex-col gap-3">
                <GradientEditor v-model="state.velvetParams.gradientStops" />
            </div>
        </div>

        <!-- Basic Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Basic Parameters</span>
                <button @click="state.uiState.velvetPanel.showBasicParams = !state.uiState.velvetPanel.showBasicParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showBasicParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showBasicParams" class="flex flex-col gap-3">
                <div v-for="param in basicSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Pile Structure -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Pile Structure</span>
                <button @click="state.uiState.velvetPanel.showPileParams = !state.uiState.velvetPanel.showPileParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showPileParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showPileParams" class="flex flex-col gap-3">
                <div v-for="param in fiberSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Crush Effect -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Crush Effect</span>
                <button @click="state.uiState.velvetPanel.showFiberParams = !state.uiState.velvetPanel.showFiberParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showFiberParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showFiberParams" class="flex flex-col gap-3">
                <div v-for="param in fiberSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Surface Details -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Surface Details</span>
                <button @click="state.uiState.velvetPanel.showAdvancedParams = !state.uiState.velvetPanel.showAdvancedParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showAdvancedParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showAdvancedParams" class="flex flex-col gap-3">
                <div v-for="param in advancedSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Lighting -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Material Properties</span>
                <button @click="state.uiState.velvetPanel.showMaterialParams = !state.uiState.velvetPanel.showMaterialParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showMaterialParams }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showMaterialParams" class="flex flex-col gap-3">
                <div v-for="param in materialSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Presets -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Presets</span>
                <button @click="state.uiState.velvetPanel.showPresets = !state.uiState.velvetPanel.showPresets" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': state.uiState.velvetPanel.showPresets }"></div>
                </button>
            </div>
            <div v-show="state.uiState.velvetPanel.showPresets" class="grid grid-cols-2 gap-2">
                <button v-for="(preset, name) in velvetPresets" :key="name" @click="applyPreset(preset)"
                    class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors">
                    {{ name }}
                </button>
            </div>
        </div>

        <button @click="generateVelvet" :disabled="isGenerating"
            class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
            <div v-else class="i-carbon-magic-wand text-lg"></div>
            {{ isGenerating ? 'Generating...' : 'Generate Velvet Texture' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import GradientEditor from '../gradient/GradientEditor.vue'
import { generateVelvetTexture } from '../../proceduralTexturing/fabrics/velvet/velvetGenerator'
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
const basicSliderItems = computed(() => [
    {
        id: 'fiberDensity',
        label: 'Fiber Density',
        value: state.velvetParams.fiberDensity,
        min: 10.0,
        max: 50.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fiberLength',
        label: 'Fiber Length',
        value: state.velvetParams.fiberLength,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fiberThickness',
        label: 'Fiber Thickness',
        value: state.velvetParams.fiberThickness,
        min: 0.05,
        max: 0.5,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fiberStiffness',
        label: 'Fiber Stiffness',
        value: state.velvetParams.fiberStiffness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Fiber Structure Parameters
const fiberSliderItems = computed(() => [
    {
        id: 'pileHeight',
        label: 'Pile Height',
        value: state.velvetParams.pileHeight,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'pileDirection',
        label: 'Pile Direction',
        value: state.velvetParams.pileDirection,
        min: 0.0,
        max: 360.0,
        step: 5.0,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Advanced Parameters
const advancedSliderItems = computed(() => [
    {
        id: 'sheenIntensity',
        label: 'Sheen Intensity',
        value: state.velvetParams.sheenIntensity,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'sheenDirection',
        label: 'Sheen Direction',
        value: state.velvetParams.sheenDirection,
        min: 0.0,
        max: 360.0,
        step: 5.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'colorVariation',
        label: 'Color Variation',
        value: state.velvetParams.colorVariation,
        min: 0.0,
        max: 0.3,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Material Parameters
const materialSliderItems = computed(() => [
    {
        id: 'roughnessMin',
        label: 'Min Roughness',
        value: state.velvetParams.roughnessMin,
        min: 0.1,
        max: 0.5,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMax',
        label: 'Max Roughness',
        value: state.velvetParams.roughnessMax,
        min: 0.5,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'normalStrength',
        label: 'Normal Strength',
        value: state.velvetParams.normalStrength,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Velvet Presets
const velvetPresets = {
    'Red Velvet': {
        baseColor: '#590510',
        sheenColor: '#ff8c9e',
        pileHeight: 0.8,
        pileDensity: 0.9,
        pileSlant: 0.4,
        slantDirection: 45.0,
        crushStrength: 0.6,
        crushScale: 0.5,
        crushDetail: 0.7,
        fiberGrain: 0.4,
        stripes: 0.0,
        stripeFrequency: 5.0,
        fbmOctaves: 4,
        noiseRoughness: 0.6,
        sheenIntensity: 0.8,
        sheenFalloff: 2.5,
        ambientOcclusion: 0.6,
        colorVariation: 0.1,
        lightSourceX: 0.5,
        lightSourceY: 0.5
    },
    'Blue Velvet': {
        baseColor: '#0a0a2e',
        sheenColor: '#6b8cff',
        pileHeight: 0.7,
        pileDensity: 0.85,
        pileSlant: 0.3,
        slantDirection: 30.0,
        crushStrength: 0.5,
        crushScale: 0.6,
        crushDetail: 0.6,
        fiberGrain: 0.3,
        stripes: 0.0,
        stripeFrequency: 5.0,
        fbmOctaves: 3,
        noiseRoughness: 0.5,
        sheenIntensity: 0.7,
        sheenFalloff: 2.0,
        ambientOcclusion: 0.5,
        colorVariation: 0.08,
        lightSourceX: 0.3,
        lightSourceY: 0.4
    },
    'Green Velvet': {
        baseColor: '#0d2818',
        sheenColor: '#7dd87d',
        pileHeight: 0.75,
        pileDensity: 0.8,
        pileSlant: 0.35,
        slantDirection: 60.0,
        crushStrength: 0.4,
        crushScale: 0.7,
        crushDetail: 0.5,
        fiberGrain: 0.35,
        stripes: 0.0,
        stripeFrequency: 5.0,
        fbmOctaves: 3,
        noiseRoughness: 0.55,
        sheenIntensity: 0.75,
        sheenFalloff: 2.2,
        ambientOcclusion: 0.55,
        colorVariation: 0.09,
        lightSourceX: 0.4,
        lightSourceY: 0.6
    },
    'Black Velvet': {
        baseColor: '#0a0a0a',
        sheenColor: '#4a4a6a',
        pileHeight: 0.9,
        pileDensity: 0.95,
        pileSlant: 0.25,
        slantDirection: 90.0,
        crushStrength: 0.7,
        crushScale: 0.4,
        crushDetail: 0.8,
        fiberGrain: 0.2,
        stripes: 0.0,
        stripeFrequency: 5.0,
        fbmOctaves: 4,
        noiseRoughness: 0.4,
        sheenIntensity: 0.9,
        sheenFalloff: 3.0,
        ambientOcclusion: 0.7,
        colorVariation: 0.05,
        lightSourceX: 0.6,
        lightSourceY: 0.3
    },
    'Corduroy': {
        baseColor: '#8b4513',
        sheenColor: '#daa520',
        pileHeight: 0.6,
        pileDensity: 0.7,
        pileSlant: 0.5,
        slantDirection: 0.0,
        crushStrength: 0.2,
        crushScale: 0.3,
        crushDetail: 0.3,
        fiberGrain: 0.5,
        stripes: 0.8,
        stripeFrequency: 8.0,
        fbmOctaves: 2,
        noiseRoughness: 0.3,
        sheenIntensity: 0.4,
        sheenFalloff: 1.5,
        ambientOcclusion: 0.4,
        colorVariation: 0.12,
        lightSourceX: 0.5,
        lightSourceY: 0.2
    },
    'Crushed Velvet': {
        baseColor: '#4b0082',
        sheenColor: '#dda0dd',
        pileHeight: 0.85,
        pileDensity: 0.9,
        pileSlant: 0.6,
        slantDirection: 135.0,
        crushStrength: 0.9,
        crushScale: 0.8,
        crushDetail: 0.9,
        fiberGrain: 0.4,
        stripes: 0.0,
        stripeFrequency: 5.0,
        fbmOctaves: 5,
        noiseRoughness: 0.7,
        sheenIntensity: 0.85,
        sheenFalloff: 2.8,
        ambientOcclusion: 0.65,
        colorVariation: 0.15,
        lightSourceX: 0.7,
        lightSourceY: 0.4
    }
}

const handleParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in state.velvetParams) {
        (state.velvetParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<any>) => {
    Object.assign(state.velvetParams, preset)
}

const pendingGeneration = ref(false)
const localIsGenerating = ref(false)

const generateVelvet = async () => {
    if (localIsGenerating.value) {
        pendingGeneration.value = true
        return
    }

    localIsGenerating.value = true

    try {
        do {
            pendingGeneration.value = false
            const imageData = await generateVelvetTexture(state.velvetParams, 1024, 1024)
            emit('set-image', imageData)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to generate velvet texture:', error)
    } finally {
        localIsGenerating.value = false
    }
}

let debounceTimer: number | null = null
const debouncedGenerateVelvet = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        generateVelvet()
    }, 50) as unknown as number
}

watch(state.velvetParams, () => {
    debouncedGenerateVelvet()
}, { deep: true })
</script>