<template>
    <div class="flex flex-col gap-4">
        <!-- Color Controls -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Colors</span>
                <button @click="showColors = !showColors" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showColors }"></div>
                </button>
            </div>
            <div v-show="showColors" class="flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <label class="text-xs text-white/40">Base Color</label>
                    <div class="flex items-center gap-2">
                        <input type="color" v-model="velvetParams.baseColor" 
                            class="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer">
                        <input type="text" v-model="velvetParams.baseColor" 
                            class="flex-1 glass-btn px-3 py-1.5 rounded-lg text-xs text-white/60 bg-white/5 border border-white/5">
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-xs text-white/40">Sheen Color</label>
                    <div class="flex items-center gap-2">
                        <input type="color" v-model="velvetParams.sheenColor" 
                            class="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer">
                        <input type="text" v-model="velvetParams.sheenColor" 
                            class="flex-1 glass-btn px-3 py-1.5 rounded-lg text-xs text-white/60 bg-white/5 border border-white/5">
                    </div>
                </div>
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
                <div v-for="param in basicSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Pile Structure -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Pile Structure</span>
                <button @click="showPileParams = !showPileParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showPileParams }"></div>
                </button>
            </div>
            <div v-show="showPileParams" class="flex flex-col gap-3">
                <div v-for="param in pileSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Crush Effect -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Crush Effect</span>
                <button @click="showCrushParams = !showCrushParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showCrushParams }"></div>
                </button>
            </div>
            <div v-show="showCrushParams" class="flex flex-col gap-3">
                <div v-for="param in crushSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Surface Details -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Surface Details</span>
                <button @click="showSurfaceParams = !showSurfaceParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showSurfaceParams }"></div>
                </button>
            </div>
            <div v-show="showSurfaceParams" class="flex flex-col gap-3">
                <div v-for="param in surfaceSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Lighting -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Lighting</span>
                <button @click="showLightingParams = !showLightingParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showLightingParams }"></div>
                </button>
            </div>
            <div v-show="showLightingParams" class="flex flex-col gap-3">
                <div v-for="param in lightingSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
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
import { computed, ref, reactive, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { generateVelvetTexture, defaultVelvetParams } from '../../proceduralTexturing/fabrics/velvet/velvetGenerator'
import type { VelvetParams } from '../../proceduralTexturing/fabrics/velvet/velvet'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// UI State
const showColors = ref(true)
const showBasicParams = ref(true)
const showPileParams = ref(true)
const showCrushParams = ref(false)
const showSurfaceParams = ref(false)
const showLightingParams = ref(false)
const showPresets = ref(false)

// Velvet Parameters State
const velvetParams = reactive<VelvetParams>({ ...defaultVelvetParams })

// Basic Parameters
const basicSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: velvetParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Pile Structure Parameters
const pileSliderItems = computed(() => [
    {
        id: 'pileHeight',
        label: 'Pile Height',
        value: velvetParams.pileHeight,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'pileDensity',
        label: 'Pile Density',
        value: velvetParams.pileDensity,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'pileSlant',
        label: 'Pile Slant',
        value: velvetParams.pileSlant,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'slantDirection',
        label: 'Slant Direction',
        value: velvetParams.slantDirection,
        min: 0.0,
        max: 360.0,
        step: 5.0,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Crush Effect Parameters
const crushSliderItems = computed(() => [
    {
        id: 'crushStrength',
        label: 'Crush Strength',
        value: velvetParams.crushStrength,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'crushScale',
        label: 'Crush Scale',
        value: velvetParams.crushScale,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'crushDetail',
        label: 'Crush Detail',
        value: velvetParams.crushDetail,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Surface Details Parameters
const surfaceSliderItems = computed(() => [
    {
        id: 'fiberGrain',
        label: 'Fiber Grain',
        value: velvetParams.fiberGrain,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'stripes',
        label: 'Stripes',
        value: velvetParams.stripes,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'stripeFrequency',
        label: 'Stripe Frequency',
        value: velvetParams.stripeFrequency,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fbmOctaves',
        label: 'FBM Octaves',
        value: velvetParams.fbmOctaves,
        min: 1,
        max: 5,
        step: 1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'noiseRoughness',
        label: 'Noise Roughness',
        value: velvetParams.noiseRoughness,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Lighting Parameters
const lightingSliderItems = computed(() => [
    {
        id: 'sheenIntensity',
        label: 'Sheen Intensity',
        value: velvetParams.sheenIntensity,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'sheenFalloff',
        label: 'Sheen Falloff',
        value: velvetParams.sheenFalloff,
        min: 0.5,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ambientOcclusion',
        label: 'Ambient Occlusion',
        value: velvetParams.ambientOcclusion,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'colorVariation',
        label: 'Color Variation',
        value: velvetParams.colorVariation,
        min: 0.0,
        max: 0.3,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'lightSourceX',
        label: 'Light Source X',
        value: velvetParams.lightSourceX,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'lightSourceY',
        label: 'Light Source Y',
        value: velvetParams.lightSourceY,
        min: -1.0,
        max: 1.0,
        step: 0.1,
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
    if (data.id in velvetParams) {
        (velvetParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<VelvetParams>) => {
    Object.assign(velvetParams, preset)
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
            const imageData = await generateVelvetTexture(velvetParams, 1024, 1024)
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

watch(velvetParams, () => {
    debouncedGenerateVelvet()
}, { deep: true })
</script>