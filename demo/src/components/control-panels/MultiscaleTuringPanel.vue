<template>
    <div class="flex flex-col gap-4">
        <!-- Reaction Core Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Reaction Core</span>
                <button @click="showReactionParams = !showReactionParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showReactionParams }"></div>
                </button>
            </div>
            <div v-show="showReactionParams" class="flex flex-col gap-3">
                <div v-for="param in reactionSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Chaos & Mutation Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Chaos & Mutation</span>
                <button @click="showChaosParams = !showChaosParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showChaosParams }"></div>
                </button>
            </div>
            <div v-show="showChaosParams" class="flex flex-col gap-3">
                <div v-for="param in chaosSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Micro-Dermis Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Micro-Dermis</span>
                <button @click="showMicroParams = !showMicroParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showMicroParams }"></div>
                </button>
            </div>
            <div v-show="showMicroParams" class="flex flex-col gap-3">
                <div v-for="param in microSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Color Controls -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Layered Material Colors</span>
                <button @click="showColors = !showColors" class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showColors }"></div>
                </button>
            </div>
            <div v-show="showColors" class="flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <label class="text-xs text-white/40">Subsurface Color</label>
                    <div class="flex items-center gap-2">
                        <input type="color" v-model="turingParams.subsurfaceColor"
                            class="w-8 h-8 rounded cursor-pointer" />
                        <input type="text" v-model="turingParams.subsurfaceColor"
                            class="glass-btn flex-1 px-2 py-1 rounded text-xs text-white/60" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-xs text-white/40">Epidermis Color</label>
                    <div class="flex items-center gap-2">
                        <input type="color" v-model="turingParams.epidermisColor"
                            class="w-8 h-8 rounded cursor-pointer" />
                        <input type="text" v-model="turingParams.epidermisColor"
                            class="glass-btn flex-1 px-2 py-1 rounded text-xs text-white/60" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-xs text-white/40">Pigment Color</label>
                    <div class="flex items-center gap-2">
                        <input type="color" v-model="turingParams.pigmentColor"
                            class="w-8 h-8 rounded cursor-pointer" />
                        <input type="text" v-model="turingParams.pigmentColor"
                            class="glass-btn flex-1 px-2 py-1 rounded text-xs text-white/60" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Light Response Parameters -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Light Response</span>
                <button @click="showLightParams = !showLightParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showLightParams }"></div>
                </button>
            </div>
            <div v-show="showLightParams" class="flex flex-col gap-3">
                <div v-for="param in lightSliderItems" :key="param.id">
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
                <button v-for="(preset, name) in turingPresets" :key="name" @click="applyPreset(preset)"
                    class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors">
                    {{ name }}
                </button>
            </div>
        </div>

        <button @click="generateTuring" :disabled="isGenerating"
            class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
            <div v-else class="i-carbon-magic-wand text-lg"></div>
            {{ isGenerating ? 'Generating...' : 'Generate Turing Texture' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { generateFilmGradeTexture, defaultFilmParams, type FilmGradeTuringParams } from '../../proceduralTexturing/other/MultiscaleTuring/turingGenerator'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// UI State
const showReactionParams = ref(true)
const showChaosParams = ref(false)
const showMicroParams = ref(false)
const showColors = ref(false)
const showLightParams = ref(false)
const showPresets = ref(false)

// Turing Parameters State
const turingParams = reactive<FilmGradeTuringParams>({ ...defaultFilmParams })

// Reaction Core Parameters
const reactionSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: turingParams.tileSize,
        min: 0.1,
        max: 50.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'simulationSteps',
        label: 'Simulation Steps',
        value: turingParams.simulationSteps,
        min: 50,
        max: 500,
        step: 10,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'activatorRadius',
        label: 'Activator Radius',
        value: turingParams.activatorRadius,
        min: 1.0,
        max: 10.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'inhibitorRadius',
        label: 'Inhibitor Radius',
        value: turingParams.inhibitorRadius,
        min: 2.0,
        max: 20.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'curvature',
        label: 'Curvature (Maze <-> Spot)',
        value: turingParams.curvature,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'diffusionAnisotropy',
        label: 'Diffusion Anisotropy',
        value: turingParams.diffusionAnisotropy,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'flowDirection',
        label: 'Flow Direction',
        value: turingParams.flowDirection,
        min: 0.0,
        max: 6.28,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Chaos & Mutation Parameters
const chaosSliderItems = computed(() => [
    {
        id: 'patternScale',
        label: 'Pattern Scale',
        value: turingParams.patternScale,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'variationScale',
        label: 'Variation Scale',
        value: turingParams.variationScale,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'variationStrength',
        label: 'Variation Strength',
        value: turingParams.variationStrength,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Micro-Dermis Parameters
const microSliderItems = computed(() => [
    {
        id: 'poreDensity',
        label: 'Pore Density',
        value: turingParams.poreDensity,
        min: 5.0,
        max: 100.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreDepth',
        label: 'Pore Depth',
        value: turingParams.poreDepth,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'skinWrinkleScale',
        label: 'Wrinkle Scale',
        value: turingParams.skinWrinkleScale,
        min: 1.0,
        max: 50.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'skinWrinkleStrength',
        label: 'Wrinkle Strength',
        value: turingParams.skinWrinkleStrength,
        min: 0.0,
        max: 0.2,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Light Response Parameters
const lightSliderItems = computed(() => [
    {
        id: 'roughnessBase',
        label: 'Base Roughness',
        value: turingParams.roughnessBase,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessPigment',
        label: 'Pigment Roughness',
        value: turingParams.roughnessPigment,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'normalDetail',
        label: 'Normal Detail',
        value: turingParams.normalDetail,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'heightDisplacement',
        label: 'Height Displacement',
        value: turingParams.heightDisplacement,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// Turing Presets
const turingPresets = {
    'Alien Carapace': {
        tileSize: 1.0,
        simulationSteps: 100,
        activatorRadius: 3.0,
        inhibitorRadius: 6.0,
        curvature: 0.5,
        diffusionAnisotropy: 0.2,
        flowDirection: 0.0,
        patternScale: 1.0,
        variationScale: 1.5,
        variationStrength: 0.3,
        poreDensity: 30.0,
        poreDepth: 0.05,
        skinWrinkleScale: 12.0,
        skinWrinkleStrength: 0.03,
        subsurfaceColor: '#8a1c0e',
        epidermisColor: '#d6b6a0',
        pigmentColor: '#1a1a1a',
        roughnessBase: 0.6,
        roughnessPigment: 0.3,
        normalDetail: 1.5,
        heightDisplacement: 1.0
    },
    'Zebra Skin': {
        tileSize: 1.5,
        simulationSteps: 150,
        activatorRadius: 2.0,
        inhibitorRadius: 4.0,
        curvature: 0.2,
        diffusionAnisotropy: 0.6,
        flowDirection: 1.57,
        patternScale: 2.0,
        variationScale: 0.8,
        variationStrength: 0.2,
        poreDensity: 15.0,
        poreDepth: 0.02,
        skinWrinkleScale: 8.0,
        skinWrinkleStrength: 0.02,
        subsurfaceColor: '#f0e6d2',
        epidermisColor: '#f5f5dc',
        pigmentColor: '#000000',
        roughnessBase: 0.7,
        roughnessPigment: 0.5,
        normalDetail: 1.0,
        heightDisplacement: 0.3
    },
    'Leopard Spots': {
        tileSize: 1.2,
        simulationSteps: 150,
        activatorRadius: 2.5,
        inhibitorRadius: 5.0,
        curvature: 0.8,
        diffusionAnisotropy: 0.0,
        flowDirection: 0.0,
        patternScale: 1.5,
        variationScale: 1.2,
        variationStrength: 0.4,
        poreDensity: 20.0,
        poreDepth: 0.03,
        skinWrinkleScale: 10.0,
        skinWrinkleStrength: 0.04,
        subsurfaceColor: '#d4a574',
        epidermisColor: '#f5deb3',
        pigmentColor: '#8b4513',
        roughnessBase: 0.65,
        roughnessPigment: 0.4,
        normalDetail: 1.2,
        heightDisplacement: 0.5
    },
    'Snake Scales': {
        tileSize: 1.0,
        simulationSteps: 200,
        activatorRadius: 1.5,
        inhibitorRadius: 3.0,
        curvature: 0.6,
        diffusionAnisotropy: 0.8,
        flowDirection: 0.785,
        patternScale: 0.8,
        variationScale: 2.0,
        variationStrength: 0.25,
        poreDensity: 25.0,
        poreDepth: 0.04,
        skinWrinkleScale: 15.0,
        skinWrinkleStrength: 0.05,
        subsurfaceColor: '#2e4e3e',
        epidermisColor: '#556b2f',
        pigmentColor: '#1a1a1a',
        roughnessBase: 0.5,
        roughnessPigment: 0.2,
        normalDetail: 2.0,
        heightDisplacement: 0.8
    }
}

const handleParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in turingParams) {
        (turingParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<FilmGradeTuringParams>) => {
    Object.assign(turingParams, preset)
}

const pendingGeneration = ref(false)
const localIsGenerating = ref(false)

const generateTuring = async () => {
    if (localIsGenerating.value) {
        pendingGeneration.value = true
        return
    }

    localIsGenerating.value = true

    try {
        do {
            pendingGeneration.value = false
            const imageData = await generateFilmGradeTexture(turingParams, 1024, 1024)
            emit('set-image', imageData)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to generate turing texture:', error)
    } finally {
        localIsGenerating.value = false
    }
}

let debounceTimer: number | null = null
const debouncedGenerateTuring = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        generateTuring()
    }, 100) as unknown as number
}

watch(turingParams, () => {
    debouncedGenerateTuring()
}, { deep: true })
</script>