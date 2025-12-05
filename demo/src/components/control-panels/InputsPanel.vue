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
                <span :class="headerClass">Procedural Texture</span>
            </div>

            <!-- Texture Type Selector -->
            <div class="flex flex-col gap-2">
                <span class="text-xs font-medium text-white/60">Type</span>
                <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2" @wheel="horizontalScroll">
                    <button v-for="type in textureTypes" :key="type" @click="proceduralType = type"
                        class="glass-btn py-2 px-4 text-xs font-medium rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0"
                        :class="proceduralType === type ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'">
                        {{ type }}
                    </button>
                </div>
            </div>

            <!-- Wood Panel -->
            <WoodPanel v-if="proceduralType === 'Wood'" :is-generating="isGenerating"
                @set-image="$emit('set-image', $event)" />

            <!-- Plain Weave Panel -->
            <PlainWeavePanel v-if="proceduralType === 'Plain Weave'" :is-generating="isGenerating"
                @set-image="$emit('set-image', $event)" />

            <!-- Leather Panel -->
            <LeatherPanel v-if="proceduralType === 'Leather'" :is-generating="isGenerating"
                @set-image="$emit('set-image', $event)" />

            <!-- Twill Weave Panel -->
            <TwillWeavePanel v-if="proceduralType === 'Twill Weave'" :is-generating="isGenerating"
                @set-image="$emit('set-image', $event)" />

            <!-- Velvet Panel -->
            <VelvetPanel v-if="proceduralType === 'Velvet'" :is-generating="isGenerating"
                @set-image="$emit('set-image', $event)" />
        </div>

        <!-- Max Resolution Slider -->
        <div v-if="originalImage" :class="sliderContainerClass">
            <Slider :items="inputSliderItems" @updateValue="$emit('slider-update', $event)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { horizontalScroll } from '../../utils/scroll'
import WoodPanel from './WoodPanel.vue'
import PlainWeavePanel from './PlainWeavePanel.vue'
import LeatherPanel from './LeatherPanel.vue'
import TwillWeavePanel from './TwillWeavePanel.vue'
import VelvetPanel from './VelvetPanel.vue'

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
const textureTypes = ['Wood', 'Plain Weave', 'Leather', 'Twill Weave', 'Velvet'] as const
const proceduralType = ref<typeof textureTypes[number]>('Wood')
const isGenerating = ref(false)

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

<style scoped>
/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 确保滚动容器样式正确 */
.overflow-x-auto {
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
    flex-wrap: nowrap;
    padding-bottom: 8px;
}
</style>
