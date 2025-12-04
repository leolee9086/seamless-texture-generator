<template>
    <div class="flex flex-col" :class="isMobile ? 'gap-6' : 'gap-6'">
        <!-- Tabs -->
        <div class="flex p-1 bg-white/5 rounded-xl">
            <button v-for="tab in ['Upload', 'Procedural']" :key="tab" @click="activeTab = tab"
                class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
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

            <!-- Wood Parameters -->
            <div class="flex flex-col gap-3">
                <div v-for="param in woodSliderItems" :key="param.id">
                    <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
                </div>
            </div>

            <button @click="generateWood" :disabled="isGenerating"
                class="w-full py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all flex items-center justify-center gap-2">
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

// Wood Parameters State
const woodParams = reactive<WoodParams>({ ...defaultWoodParams })

const woodSliderItems = computed(() => [
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
        max: 1.0,
        step: 0.05,
        valuePosition: 'after' as const,
        showRuler: false
    },
    {
        id: 'poreDensity',
        label: 'Pores',
        value: woodParams.poreDensity,
        min: 0.0,
        max: 50.0,
        step: 1.0,
        valuePosition: 'after' as const,
        showRuler: false
    }
])

const handleWoodParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in woodParams) {
        (woodParams as any)[data.id] = data.value
    }
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
        ? 'px-3 py-1.5 rounded-full bg-white/10 border border-white/5 text-xs font-medium text-white'
        : 'px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/5 text-xs font-medium text-white transition-all disabled:opacity-50'
)

const uploadAreaClass = computed(() =>
    props.isMobile
        ? 'relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 h-28 flex items-center justify-center'
        : 'relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group h-32 flex items-center justify-center'
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
