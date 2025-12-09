<template>
    <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Reaction Core (Gray-Scott)</span>
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

        <!-- 空间变化参数 -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-white/60">Spatial Variation</span>
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
            {{ isGenerating ? 'Generating...' : 'Generate Gray-Scott Texture' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { generateFilmGradeTexture, defaultFilmParams, type FilmGradeTuringParams } from '../../proceduralTexturing/other/GrayScottTuring/turingGenerator'

const props = defineProps<{
    isGenerating: boolean
}>()

const emit = defineEmits<{
    'set-image': [imageData: string]
}>()

// UI State
const showReactionParams = ref(true)
const showChaosParams = ref(false)
const showPresets = ref(false)

// Turing Parameters State
const turingParams = reactive<FilmGradeTuringParams>({ ...defaultFilmParams })

// Reaction Core Parameters (Gray-Scott Specific)
const reactionSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: turingParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'simulationSteps',
        label: 'Simulation Steps',
        value: turingParams.simulationSteps,
        min: 100,
        max: 5000,
        step: 100,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'feedRate',
        label: 'Feed Rate (F)',
        value: turingParams.feedRate,
        min: 0.010,
        max: 0.100,
        step: 0.001,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'killRate',
        label: 'Kill Rate (K)',
        value: turingParams.killRate,
        min: 0.030,
        max: 0.070,
        step: 0.001,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'diffusionAnisotropy',
        label: 'Diffusion Anisotropy',
        value: turingParams.diffusionAnisotropy,
        min: 0.0,
        max: 1.0,
        step: 0.001,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'flowDirection',
        label: 'Flow Direction',
        value: turingParams.flowDirection,
        min: 0.0,
        max: 6.28,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

// 空间变化参数
const chaosSliderItems = computed(() => [
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

// Gray-Scott预设
const turingPresets = {
    'Coral / Maze': {
        feedRate: 0.055,
        killRate: 0.062,
        simulationSteps: 2000,
        diffusionAnisotropy: 0.0,
        variationStrength: 0.2
    },
    'Mitosis / Dots': {
        feedRate: 0.0367,
        killRate: 0.0649,
        simulationSteps: 3000,
        diffusionAnisotropy: 0.0,
        variationStrength: 0.1
    },
    'Exotic / Ripples': {
        feedRate: 0.018,
        killRate: 0.051,
        simulationSteps: 3000,
        diffusionAnisotropy: 0.5,
        flowDirection: 0.8,
        variationStrength: 0.3
    },
    'Chaotic / Worms': {
        feedRate: 0.050,
        killRate: 0.065,
        simulationSteps: 2500,
        diffusionAnisotropy: 0.0,
        variationStrength: 0.4
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
