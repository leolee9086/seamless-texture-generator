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
                <GradientEditor v-model="leatherParams.gradientStops" />
            </div>
        </div>

        <!-- Grain Pattern -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Grain Pattern</span>
                <button @click="showGrainParams = !showGrainParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showGrainParams }"></div>
                </button>
            </div>
            <div v-show="showGrainParams" class="flex flex-col gap-3">
                <div v-for="param in grainSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Boundaries (Grooves) -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Boundaries & Grooves</span>
                <button @click="showBoundaryParams = !showBoundaryParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showBoundaryParams }"></div>
                </button>
            </div>
            <div v-show="showBoundaryParams" class="flex flex-col gap-3">
                <div v-for="param in boundarySliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Surface Detail -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Surface Detail (Pores/Wrinkles)</span>
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

        <!-- Fiber & Fine Lines (New) -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Fibers & Fine Lines</span>
                <button @click="showFiberParams = !showFiberParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showFiberParams }"></div>
                </button>
            </div>
            <div v-show="showFiberParams" class="flex flex-col gap-3">
                <div v-for="param in fiberSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
                </div>
            </div>
        </div>

        <!-- Imperfections & Aging -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Imperfections & Aging</span>
                <button @click="showAgingParams = !showAgingParams"
                    class="text-white/40 hover:text-white/60 transition-colors">
                    <div class="i-carbon-chevron-down text-sm transition-transform"
                        :class="{ 'rotate-180': showAgingParams }"></div>
                </button>
            </div>
            <div v-show="showAgingParams" class="flex flex-col gap-3">
                <div v-for="param in agingSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleParamUpdate" />
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
                <div v-for="param in materialSliderItems" :key="param.id">
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
                <button v-for="(preset, name) in leatherPresets" :key="name" @click="applyPreset(preset)"
                    class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors">
                    {{ name }}
                </button>
            </div>
        </div>

        <button @click="generateLeather" :disabled="isGenerating"
            class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
            <div v-else class="i-carbon-magic-wand text-lg"></div>
            {{ isGenerating ? 'Generating...' : 'Generate Leather Texture' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import GradientEditor from '../gradient/GradientEditor.vue'
import { generateLeatherTexture, defaultLeatherParams, type LeatherParams } from '../../proceduralTexturing/leather/leatherGenerator'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// UI State
const showColors = ref(true)
const showGrainParams = ref(true)
const showBoundaryParams = ref(false)
const showSurfaceParams = ref(false)
const showFiberParams = ref(false)
const showAgingParams = ref(false)
const showMaterialParams = ref(false)
const showPresets = ref(false)

// Params State
const leatherParams = reactive<LeatherParams>({ ...defaultLeatherParams })

// --- Sliders Definition ---

const grainSliderItems = computed(() => [
    {
        id: 'tileSize', label: 'Tile Size', value: leatherParams.tileSize,
        min: 0.1, max: 5.0, step: 0.1, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'cellScale', label: 'Cell Scale', value: leatherParams.cellScale,
        min: 5.0, max: 40.0, step: 1.0, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'cellRandomness', label: 'Randomness', value: leatherParams.cellRandomness,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'cellStretch', label: 'Stretch', value: leatherParams.cellStretch,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'cellStretchAngle', label: 'Stretch Angle', value: leatherParams.cellStretchAngle,
        min: 0.0, max: 3.14, step: 0.1, valuePosition: 'after' as const, showRuler: false
    }
])

const boundarySliderItems = computed(() => [
    {
        id: 'grooveWidth', label: 'Groove Width', value: leatherParams.grooveWidth,
        min: 0.01, max: 0.5, step: 0.01, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'grooveDepth', label: 'Groove Depth', value: leatherParams.grooveDepth,
        min: 0.1, max: 2.0, step: 0.1, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'grooveProfile', label: 'Profile (V-U)', value: leatherParams.grooveProfile,
        min: 0.0, max: 1.0, step: 0.1, valuePosition: 'after' as const, showRuler: false
    },
])

const surfaceSliderItems = computed(() => [
    {
        id: 'wrinkleScale', label: 'Wrinkle Scale', value: leatherParams.wrinkleScale,
        min: 1.0, max: 20.0, step: 0.5, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'wrinkleIntensity', label: 'Wrinkle Strength', value: leatherParams.wrinkleIntensity,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'poreDensity', label: 'Pore Density', value: leatherParams.poreDensity,
        min: 0.0, max: 10.0, step: 0.1, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'poreDepth', label: 'Pore Depth', value: leatherParams.poreDepth,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'poreVisibility', label: 'Pore Visibility', value: leatherParams.poreVisibility,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
])

const fiberSliderItems = computed(() => [
    {
        id: 'fiberScale', label: 'Fiber Scale', value: leatherParams.fiberScale,
        min: 5.0, max: 50.0, step: 1.0, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'fiberStrength', label: 'Fiber Strength', value: leatherParams.fiberStrength,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'fiberDetail', label: 'Fiber Detail', value: leatherParams.fiberDetail,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'fiberDirectionality', label: 'Directionality', value: leatherParams.fiberDirectionality,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'fiberRandomness', label: 'Random Direction', value: leatherParams.fiberRandomness,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
])

const agingSliderItems = computed(() => [
    {
        id: 'creaseIntensity', label: 'Creases', value: leatherParams.creaseIntensity,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'creaseFrequency', label: 'Crease Freq', value: leatherParams.creaseFrequency,
        min: 0.5, max: 5.0, step: 0.1, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'wearLevel', label: 'Wear Level', value: leatherParams.wearLevel,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'scratchCount', label: 'Scratches', value: leatherParams.scratchCount,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'scratchIntensity', label: 'Scratch Intensity', value: leatherParams.scratchIntensity,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
])

const materialSliderItems = computed(() => [
    {
        id: 'roughnessMin', label: 'Min Roughness', value: leatherParams.roughnessMin,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'roughnessMax', label: 'Max Roughness', value: leatherParams.roughnessMax,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'normalStrength', label: 'Normal Strength', value: leatherParams.normalStrength,
        min: 1.0, max: 20.0, step: 0.5, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'patinaStrength', label: 'Patina / Dirt', value: leatherParams.patinaStrength,
        min: 0.0, max: 1.0, step: 0.05, valuePosition: 'after' as const, showRuler: false
    },
    {
        id: 'colorVariation', label: 'Color Variation', value: leatherParams.colorVariation,
        min: 0.0, max: 0.5, step: 0.01, valuePosition: 'after' as const, showRuler: false
    },
])

// --- Presets ---
const leatherPresets = {
    'Cowhide (Full Grain)': {
        cellScale: 15.0, cellRandomness: 0.7, grooveWidth: 0.15, grooveDepth: 1.0,
        wrinkleScale: 8.0, wrinkleIntensity: 0.3, poreDensity: 2.0, poreDepth: 0.3,
        wearLevel: 0.0, roughnessMin: 0.3, roughnessMax: 0.6,
        gradientStops: [{ offset: 0, color: '#3E2723' }, { offset: 1, color: '#8D6E63' }]
    },
    'Buffalo (Rough)': {
        cellScale: 8.0, cellRandomness: 0.9, grooveWidth: 0.25, grooveDepth: 1.5,
        wrinkleScale: 4.0, wrinkleIntensity: 0.6, poreDensity: 4.0, poreVisibility: 0.8,
        wearLevel: 0.2, roughnessMin: 0.5, roughnessMax: 0.9,
        gradientStops: [{ offset: 0, color: '#1A120B' }, { offset: 1, color: '#3C2A21' }]
    },
    'Aged Saddle': {
        cellScale: 12.0, cellRandomness: 0.6, grooveWidth: 0.2, grooveDepth: 0.8,
        creaseIntensity: 0.6, wearLevel: 0.8, patinaStrength: 0.6,
        roughnessMin: 0.2, roughnessMax: 0.7, // Polished high spots
        gradientStops: [{ offset: 0, color: '#2C1B10' }, { offset: 1, color: '#A0522D' }]
    },
    'Fine Nappa': {
        cellScale: 25.0, cellRandomness: 0.4, grooveWidth: 0.1, grooveDepth: 0.5,
        wrinkleIntensity: 0.1, poreVisibility: 0.2,
        roughnessMin: 0.4, roughnessMax: 0.6,
        gradientStops: [{ offset: 0, color: '#212121' }, { offset: 1, color: '#424242' }]
    },
    'Reptile / Gator': {
        cellScale: 6.0, cellRandomness: 0.2, cellStretch: 0.0,
        grooveWidth: 0.3, grooveProfile: 0.0, grooveDepth: 2.0,
        roughnessMin: 0.1, roughnessMax: 0.4,
        gradientStops: [{ offset: 0, color: '#003300' }, { offset: 1, color: '#336633' }]
    }
}

const handleParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in leatherParams) {
        (leatherParams as any)[data.id] = data.value
    }
}

const applyPreset = (preset: Partial<LeatherParams>) => {
    Object.assign(leatherParams, preset)
}

// --- Generation Logic ---

const pendingGeneration = ref(false)
const localIsGenerating = ref(false)

const generateLeather = async () => {
    if (localIsGenerating.value) {
        pendingGeneration.value = true
        return
    }
    localIsGenerating.value = true
    try {
        do {
            pendingGeneration.value = false
            // Default 1024 like wood
            const imageData = await generateLeatherTexture(leatherParams, 1024, 1024)
            emit('set-image', imageData)
        } while (pendingGeneration.value)
    } catch (error) {
        console.error('Failed to generate leather texture:', error)
    } finally {
        localIsGenerating.value = false
    }
}

let debounceTimer: number | null = null
const debouncedGenerate = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        generateLeather()
    }, 100) as unknown as number
}

watch(leatherParams, () => {
    debouncedGenerate()
}, { deep: true })

</script>
