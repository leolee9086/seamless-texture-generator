<template>
    <div class="flex flex-col" :class="isMobile ? 'gap-6' : 'gap-6'">
        <!-- Tabs -->
        <div class="flex p-1 bg-white/5 rounded-xl">
            <button v-for="tab in ['Upload', 'Procedural']" :key="tab" @click="activeTab = tab"
                class="glass-btn flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
                :class="activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'">
                {{ tab }}
            </button>
        </div>

        <!-- Upload Tab Content -->
        <div v-if="activeTab === 'Upload'" class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <span :class="headerClass">Source</span>
                <div class="flex gap-2">
                    <button @click="$emit('load-sample')" :disabled="isProcessing" :class="actionButtonClass">
                        Sample
                    </button>
                    <label :class="actionButtonClass + ' cursor-pointer flex items-center'">
                        <div class="i-carbon-camera" :class="isMobile ? '' : 'mr-2'"></div>
                        <span :class="isMobile ? 'ml-1.5' : ''">Camera</span>
                        <input type="file" accept="image/*" capture="environment"
                            @change="$emit('image-upload', $event)" class="hidden" />
                    </label>
                </div>
            </div>

            <label :class="uploadAreaClass">
                <div class="absolute inset-0 flex flex-col items-center justify-center z-10"
                    :class="isMobile ? 'gap-2' : 'gap-3'">
                    <div
                        :class="['i-carbon-image text-white/50 group-hover:text-white group-hover:scale-110 transition-all duration-300', isMobile ? 'text-3xl' : 'text-1xl']">
                    </div>
                    <div class="flex flex-col items-center">
                        <span :class="uploadTextClass">{{ originalImage ? 'Change Image' : 'Select Image' }}</span>
                        <span v-if="!isMobile" class="text-xs text-white/40 mt-1">Click to upload</span>
                    </div>
                </div>
                <!-- Preview Background -->
                <div v-if="originalImage" :class="previewClass" :style="{ backgroundImage: `url(${originalImage})` }">
                </div>
                <input type="file" accept="image/*" @change="$emit('image-upload', $event)" class="hidden" />
            </label>
        </div>

        <!-- Procedural Tab Content -->
        <div v-else class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <span :class="headerClass">Procedural Wood</span>
            </div>

            <!-- Color Controls -->
            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-white/60">Colors</span>
                    <button @click="showColors = !showColors"
                        class="text-white/40 hover:text-white/60 transition-colors">
                        <div class="i-carbon-chevron-down text-sm transition-transform"
                            :class="{ 'rotate-180': showColors }"></div>
                    </button>
                </div>
                <div v-show="showColors" class="flex flex-col gap-3">
                    <!-- Early Wood Color -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 flex-1">Early Wood</label>
                        <div class="flex items-center gap-2">
                            <input type="color"
                                :value="rgbToHex(woodParams.colorEarly)"
                                @input="handleColorUpdate('colorEarly', $event.target.value)"
                                class="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer">
                            <span class="text-xs text-white/40 font-mono">
                                {{ rgbToHex(woodParams.colorEarly) }}
                            </span>
                        </div>
                    </div>
                    <!-- Late Wood Color -->
                    <div class="flex items-center gap-3">
                        <label class="text-xs text-white/60 flex-1">Late Wood</label>
                        <div class="flex items-center gap-2">
                            <input type="color"
                                :value="rgbToHex(woodParams.colorLate)"
                                @input="handleColorUpdate('colorLate', $event.target.value)"
                                class="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer">
                            <span class="text-xs text-white/40 font-mono">
                                {{ rgbToHex(woodParams.colorLate) }}
                            </span>
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
                    <div v-for="param in basicWoodSliderItems" :key="param.id">
                        <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                    </div>
                </div>
            </div>

            <!-- Pore Parameters -->
            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-white/60">Pore Parameters</span>
                    <button @click="showPoreParams = !showPoreParams"
                        class="text-white/40 hover:text-white/60 transition-colors">
                        <div class="i-carbon-chevron-down text-sm transition-transform"
                            :class="{ 'rotate-180': showPoreParams }"></div>
                    </button>
                </div>
                <div v-show="showPoreParams" class="flex flex-col gap-3">
                    <div v-for="param in poreWoodSliderItems" :key="param.id">
                        <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
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
                    <div v-for="param in advancedWoodSliderItems" :key="param.id">
                        <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
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
                    <div v-for="param in materialWoodSliderItems" :key="param.id">
                        <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                    </div>
                </div>
            </div>

            <!-- Presets -->
            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-white/60">Presets</span>
                    <button @click="showPresets = !showPresets"
                        class="text-white/40 hover:text-white/60 transition-colors">
                        <div class="i-carbon-chevron-down text-sm transition-transform"
                            :class="{ 'rotate-180': showPresets }"></div>
                    </button>
                </div>
                <div v-show="showPresets" class="grid grid-cols-2 gap-2">
                    <button v-for="(preset, name) in woodPresets" :key="name"
                        @click="applyPreset(preset)"
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

        <!-- Max Resolution Slider -->
        <div v-if="originalImage" :class="sliderContainerClass">
            <Slider :items="inputSliderItems" @updateValue="$emit('slider-update', $event)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { generateWoodTexture, defaultWoodParams, type WoodParams } from '../../utils/procedural/woodGenerator'

const props = defineProps<{
    isMobile?: boolean
    isProcessing: boolean
    originalImage: string | null
    inputSliderItems: any[]
}>()

const emit = defineEmits<{
    'load-sample': []
    'image-upload': [event: Event]
    'slider-update': [data: { id: string; value: number }]
    'set-image': [imageData: string]
}>()

const activeTab = ref('Upload')
const isGenerating = ref(false)

// UI State
const showColors = ref(true)
const showBasicParams = ref(true)
const showPoreParams = ref(false)
const showAdvancedParams = ref(false)
const showMaterialParams = ref(false)
const showPresets = ref(false)

// Wood Parameters State
const woodParams = reactive<WoodParams>({ ...defaultWoodParams })

// Basic Parameters
const basicWoodSliderItems = computed(() => [
    {
        id: 'tileSize',
        label: 'Tile Size',
        value: woodParams.tileSize,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ringScale',
        label: 'Ring Scale',
        value: woodParams.ringScale,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ringDistortion',
        label: 'Distortion',
        value: woodParams.ringDistortion,
        min: 0.0,
        max: 3.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotIntensity',
        label: 'Knots',
        value: woodParams.knotIntensity,
        min: 0.0,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'latewoodBias',
        label: 'Sharpness',
        value: woodParams.latewoodBias,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'rayStrength',
        label: 'Rays',
        value: woodParams.rayStrength,
        min: 0.0,
        max: 10.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreDensity',
        label: 'Pores',
        value: woodParams.poreDensity,
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
        value: woodParams.fbmOctaves,
        min: 1,
        max: 5,
        step: 1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'fbmAmplitude',
        label: 'FBM Amplitude',
        value: woodParams.fbmAmplitude,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotFrequency',
        label: 'Knot Frequency',
        value: woodParams.knotFrequency,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'distortionFreq',
        label: 'Distortion Frequency',
        value: woodParams.distortionFreq,
        min: 1.0,
        max: 3.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'ringNoiseFreq',
        label: 'Ring Noise Frequency',
        value: woodParams.ringNoiseFreq,
        min: 3.0,
        max: 10.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'rayFrequencyX',
        label: 'Ray Frequency X',
        value: woodParams.rayFrequencyX,
        min: 10.0,
        max: 300.0,
        step: 5.0,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'rayFrequencyY',
        label: 'Ray Frequency Y',
        value: woodParams.rayFrequencyY,
        min: 1.0,
        max: 50.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotThresholdMin',
        label: 'Knot Threshold Min',
        value: woodParams.knotThresholdMin,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'knotThresholdMax',
        label: 'Knot Threshold Max',
        value: woodParams.knotThresholdMax,
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
        value: woodParams.poreScale,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreThresholdEarly',
        label: 'Early Wood Threshold',
        value: woodParams.poreThresholdEarly,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreThresholdLate',
        label: 'Late Wood Threshold',
        value: woodParams.poreThresholdLate,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreThresholdRange',
        label: 'Threshold Range',
        value: woodParams.poreThresholdRange,
        min: 0.05,
        max: 0.5,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreStrength',
        label: 'Pore Strength',
        value: woodParams.poreStrength,
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
        value: woodParams.normalStrength,
        min: 1.0,
        max: 20.0,
        step: 0.5,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMin',
        label: 'Min Roughness',
        value: woodParams.roughnessMin,
        min: 0.1,
        max: 0.5,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'roughnessMax',
        label: 'Max Roughness',
        value: woodParams.roughnessMax,
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
        colorEarly: [0.92, 0.85, 0.68], // Light yellowish
        colorLate: [0.65, 0.45, 0.30],  // Brown
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
        poreStrength: 0.3,
    },
    'White Oak': {
        tileSize: 1.0,
        ringScale: 12.0,
        ringDistortion: 1.2,
        knotIntensity: 0.8,
        latewoodBias: 3.0,
        rayStrength: 0.8,
        poreDensity: 20.0,
        colorEarly: [0.86, 0.78, 0.65], // Light brown
        colorLate: [0.45, 0.35, 0.25], // Dark brown
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
        poreStrength: 0.4,
    },
    'Walnut': {
        tileSize: 1.0,
        ringScale: 8.0,
        ringDistortion: 1.5,
        knotIntensity: 1.0,
        latewoodBias: 1.5,
        rayStrength: 0.3,
        poreDensity: 5.0,
        colorEarly: [0.55, 0.40, 0.25], // Dark brown
        colorLate: [0.25, 0.15, 0.10], // Very dark brown
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
        poreStrength: 0.25,
    }
}

const handleWoodParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in woodParams) {
        (woodParams as any)[data.id] = data.value
    }
}

// Color handling functions
const rgbToHex = (rgb: number[]): string => {
    const toHex = (n: number) => {
        const hex = Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`
}

const hexToRgb = (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [0, 0, 0]
}

const handleColorUpdate = (paramName: 'colorEarly' | 'colorLate', hexValue: string) => {
    woodParams[paramName] = hexToRgb(hexValue)
}

const applyPreset = (preset: Partial<WoodParams>) => {
    Object.assign(woodParams, preset)
}

const generateWood = async () => {
    isGenerating.value = true
    try {
        // Generate a 1024x1024 texture
        const imageData = await generateWoodTexture(woodParams, 1024, 1024)
        emit('set-image', imageData)
    } catch (error) {
        console.error('Failed to generate wood texture:', error)
        // You might want to emit an error event or show a notification
    } finally {
        isGenerating.value = false
    }
}

const headerClass = computed(() =>
    props.isMobile
        ? 'text-xs font-bold text-gray-400 uppercase tracking-wider'
        : 'text-sm font-medium text-gray-400 uppercase tracking-wider'
)

const actionButtonClass = computed(() =>
    props.isMobile
        ? 'glass-btn px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-white/60 hover:text-white/90 transition-colors disabled:opacity-50'
        : 'glass-btn px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-white/60 hover:text-white/90 transition-all disabled:opacity-50'
)

const uploadAreaClass = computed(() =>
    props.isMobile
        ? 'glass-btn relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 h-28 flex items-center justify-center'
        : 'glass-btn relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group h-32 flex items-center justify-center'
)

const uploadTextClass = computed(() =>
    props.isMobile
        ? 'text-xs font-medium text-white/90'
        : 'text-sm font-medium text-white/90'
)

const previewClass = computed(() =>
    props.isMobile
        ? 'absolute inset-0 opacity-30 blur-lg bg-cover bg-center'
        : 'absolute inset-0 opacity-20 blur-xl bg-cover bg-center'
)

const sliderContainerClass = computed(() =>
    props.isMobile
        ? 'bg-white/5 rounded-2xl border border-white/5'
        : 'bg-white/5 rounded-2xl border border-white/5'
)
</script>
