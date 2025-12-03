<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else>
            <!-- Header Actions (Mobile Only) -->
            <Teleport to="#header-actions-container" v-if="isMobile && layers.length > 0">
                <button @click="toggleMobileMaskPreview"
                    class="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/30 transition-colors">
                    <div class="i-carbon-view text-lg"></div>
                </button>
            </Teleport>

            <!-- Secondary Navigation (Mobile Only) -->
            <Teleport to="#secondary-nav-container" v-if="isMobile">
                <div
                    class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide w-full bg-black border-t border-white/5">
                    <!-- LUT Tab -->
                    <button @click="switchToTab('lut')"
                        class="flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border transition-all duration-200"
                        :class="activeMobileTab === 'lut' ? 'bg-white/20 border-white/40 text-white' : 'bg-black/40 border-white/10 text-white/50'">
                        <div class="i-carbon-color-palette text-lg mb-0.5"></div>
                        <span class="text-[9px] font-medium">LUT</span>
                    </button>

                    <!-- Layer Tabs -->
                    <button v-for="layer in layers" :key="layer.id" @click="switchToTab(layer.id)"
                        class="relative flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border transition-all duration-200 overflow-hidden"
                        :class="activeMobileTab === layer.id ? 'border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'border-white/10 opacity-80'">
                        <!-- Background Color Preview -->
                        <div class="absolute inset-0 opacity-50"
                            :style="{ backgroundColor: layer.type === 'quantized' && layer.color ? `rgb(${layer.color.r},${layer.color.g},${layer.color.b})` : (layer.type === 'hsl' && layer.hslRange ? getHslBlockColor(layer.hslRange) : '#333') }">
                        </div>
                        <div class="relative z-10 text-xs font-bold text-white shadow-black drop-shadow-md">
                            {{ layer.type === 'hsl' ? 'HSL' : 'RGB' }}
                        </div>
                        <div v-if="!layer.visible"
                            class="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                            <div class="i-carbon-view-off text-white/80 text-lg"></div>
                        </div>
                    </button>

                    <!-- Add Button -->
                    <button @click="switchToTab('add')"
                        class="flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-lg border border-dashed transition-all duration-200"
                        :class="activeMobileTab === 'add' ? 'bg-white/10 border-white/40 text-white' : 'bg-transparent border-white/20 text-white/50'">
                        <div class="i-carbon-add text-xl"></div>
                    </button>
                </div>
            </Teleport>

            <!-- Main Content Area -->
            <div :class="contentContainerClass">
                <!-- LUT Gallery & Intensity (Show in 'lut' tab or on Desktop) -->
                <div v-if="!isMobile || activeMobileTab === 'lut'" class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                    <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-white/80">
                            LUT Library
                        </label>
                        <button @click="updateAllThumbnails" :disabled="isUpdatingThumbnails || !originalImage"
                            class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                            <div :class="isUpdatingThumbnails ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-renew'">
                            </div>
                            <span>Update All</span>
                        </button>
                    </div>

                    <LUTGallery :luts="luts" :selected-id="selectedLutId" @trigger-upload="triggerUpload"
                        @select="handleSelectLUT" @delete="handleDeleteLUT" @update-thumbnail="handleUpdateThumbnail" />

                    <!-- Hidden Input -->
                    <input ref="lutInputRef" type="file" accept=".cube" multiple @change="handleLUTFileChange"
                        class="hidden" />

                    <!-- Selected LUT Controls -->
                    <div v-if="selectedLutId" class="mt-4 border-t border-white/5 pt-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs text-white/60">{{ selectedLutName }}</span>
                            <div class="flex gap-2">
                                <button v-if="processedImage" @click="updateCurrentThumbnail"
                                    class="glass-btn p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                                    title="Update thumbnail from current result">
                                    <div class="i-carbon-image-copy text-sm"></div>
                                </button>
                                <button @click="clearSelection"
                                    class="glass-btn p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                                    title="Clear selection">
                                    <div class="i-carbon-close text-sm"></div>
                                </button>
                            </div>
                        </div>

                        <Slider :items="lutSliderItems" @updateValue="handleSliderUpdate" />
                    </div>

                    <!-- Desktop Color Block Selector (Full Mode) -->
                    <div v-if="!isMobile && selectedLutId" class="mt-4 border-t border-white/5 pt-4">
                        <ColorBlockSelector :processing="false" :quantized-color-blocks="quantizedColorBlocks"
                            :common-hsl-blocks="commonHslBlocks" :layers="layers" :active-layer-id="activeLayerId"
                            :is-mobile="false" @add-color-layer="addColorLayer" @add-hsl-layer="addHslLayer"
                            @remove-layer="removeLayer" @select-layer="selectLayer" @update-layer="updateLayer" />
                    </div>
                </div>

                <!-- Mobile: Add Color Layer Mode -->
                <div v-if="isMobile && activeMobileTab === 'add'" class="pb-3 pt-3">
                    <ColorBlockSelector :processing="false" :quantized-color-blocks="quantizedColorBlocks"
                        :common-hsl-blocks="commonHslBlocks" :layers="layers" :active-layer-id="activeLayerId"
                        mode="add-only" :is-mobile="true" @add-color-layer="addColorLayer" @add-hsl-layer="addHslLayer"
                        @remove-layer="removeLayer" @select-layer="selectLayer" @update-layer="updateLayer" />
                </div>

                <!-- Mobile: Layer Settings Mode -->
                <div v-if="isMobile && activeMobileTab !== 'lut' && activeMobileTab !== 'add'" class="pb-3 pt-3">
                    <ColorBlockSelector :processing="false" :quantized-color-blocks="quantizedColorBlocks"
                        :common-hsl-blocks="commonHslBlocks" :layers="layers" :active-layer-id="activeLayerId"
                        mode="settings-only" :is-mobile="true" @add-color-layer="addColorLayer"
                        @add-hsl-layer="addHslLayer" @remove-layer="removeLayer" @select-layer="selectLayer"
                        @update-layer="updateLayer" />
                </div>

                <!-- Mask Preview Panel (Always present but hidden content on mobile) -->
                <div v-if="selectedLutId" class="mt-4 border-t border-white/5 pt-4" :class="{ 'px-4': !isMobile }">
                    <MaskPreviewPanel ref="maskPreviewPanelRef" :processing="false" :original-image="originalImage"
                        :layers="layers" :mask-options="maskOptions" :is-mobile="isMobile"
                        :update-mask-preview="updateMaskPreview"
                        :generate-mask-preview-image-data-url="generateMaskPreviewImageDataUrl"
                        :generate-color-block-mask="generateColorBlockMask" @update:mask-options="updateMaskOptions"
                        @set-preview-overlay="handleSetPreviewOverlay" />
                </div>
            </div>

            <!-- LUT Status Hint -->
            <div v-if="lutEnabled && !selectedLutId" class="pb-3" :class="{ 'px-4': !isMobile }">
                <div
                    class="text-xs text-yellow-400/80 bg-yellow-400/10 rounded-lg px-3 py-2 border border-yellow-400/20">
                    <div class="flex items-start gap-2">
                        <div class="i-carbon-warning text-sm mt-0.5"></div>
                        <span>Please select a LUT from the library</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Teleport } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import LUTGallery from './LUTGallery.vue'
import ColorBlockSelector from './ColorBlockSelector.vue'
import MaskPreviewPanel from '../previews/MaskPreviewPanel.vue'
import { lutDb, type LUTItem } from '../../utils/lutDb'
import { processImageToTileable } from '../../utils/imageProcessor'
import { useColorBlockSelector } from '../../composables/useColorBlockSelector'
import { getHslBlockColor } from '../../utils/lut/getHslBlockColor'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    processedImage?: string | null
    lutIntensity: number
    lutFileName: string | null
}>()

const emit = defineEmits<{
    'toggle-lut': []
    'lut-file-change': [file: File]
    'clear-lut': []
    'slider-update': [data: { id: string; value: number }]
    'mask-update': [maskGenerator: (() => Promise<Uint8Array | null>) | null]
    'control-event': [event: any]
}>()

// State
const luts = ref<LUTItem[]>([])
const selectedLutId = ref<string | null>(null)
const lutInputRef = ref<HTMLInputElement>()
const isUpdatingThumbnails = ref(false)
const activeMobileTab = ref<string>('lut')
const maskPreviewPanelRef = ref<InstanceType<typeof MaskPreviewPanel> | null>(null)

// Color Block Selector Logic
const {
    quantizedColorBlocks,
    commonHslBlocks,
    layers,
    activeLayerId,
    maskOptions,
    generateColorBlocks,
    addColorLayer,
    addHslLayer,
    removeLayer,
    selectLayer,
    updateLayer,
    generateColorBlockMask,
    updateMaskPreview,
    generateMaskPreviewImageDataUrl
} = useColorBlockSelector()

// Computed
const lutEnabled = computed(() => !!props.lutFileName)
const selectedLutName = computed(() => {
    return luts.value.find(l => l.id === selectedLutId.value)?.name || props.lutFileName
})

const lutSliderItems = computed(() => [
    {
        id: 'lut-intensity',
        label: 'Intensity',
        value: props.lutIntensity,
        min: 0,
        max: 1,
        step: 0.01,
    }
])

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile
        ? 'flex flex-col gap-3'
        : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
)

// Methods
const loadLUTs = async () => {
    try {
        luts.value = await lutDb.getAllLUTs()
    } catch (error) {
        console.error('Failed to load LUTs:', error)
    }
}

const triggerUpload = () => {
    lutInputRef.value?.click()
}

const handleLUTFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const lutItem: LUTItem = {
            id: crypto.randomUUID(),
            name: file.name,
            file: file,
            createdAt: Date.now()
        }
        await lutDb.addLUT(lutItem)
    }

    await loadLUTs()
    input.value = '' // Reset input

    // Auto update thumbnails for new LUTs if we have an image
    if (props.originalImage) {
        // We could do this, but maybe let the user decide or do it in background?
        // Let's just reload for now.
    }
}

const handleSelectLUT = (lut: LUTItem) => {
    selectedLutId.value = lut.id
    // Convert Blob to File object if needed, though Blob is fine for most APIs
    // The parent expects a File object
    const file = new File([lut.file], lut.name, { type: 'text/plain' })
    emit('lut-file-change', file)
}

const handleDeleteLUT = async (id: string) => {
    if (confirm('Are you sure you want to delete this LUT?')) {
        await lutDb.deleteLUT(id)
        if (selectedLutId.value === id) {
            clearSelection()
        }
        await loadLUTs()
    }
}

const clearSelection = () => {
    selectedLutId.value = null
    emit('clear-lut')
}

const handleSliderUpdate = (data: { id: string; value: number }) => {
    emit('slider-update', data)
}

const handleUpdateThumbnail = async (id: string) => {
    if (!props.originalImage) {
        console.warn('Cannot update thumbnail: No original image available')
        return
    }

    const lut = luts.value.find(l => l.id === id)
    if (!lut) return

    try {
        console.log('Updating thumbnail for LUT:', lut.name)

        // Create a File object from the stored Blob
        const lutFile = new File([lut.file], lut.name, { type: 'text/plain' })

        // Process image with this LUT
        // Use a smaller resolution for speed, and 0 border size (no seamless processing) for pure color preview
        const processedUrl = await processImageToTileable(
            props.originalImage,
            512, // Max resolution
            0,   // Border size (0 = no seamless processing)
            undefined,
            undefined,
            undefined,
            lutFile,
            1.0 // Intensity
        )

        const thumbnail = await createThumbnail(props.originalImage, processedUrl)
        await lutDb.updateLUTThumbnail(id, thumbnail)
        await loadLUTs()
        console.log('Thumbnail updated successfully for:', lut.name)
    } catch (error) {
        console.error('Failed to update thumbnail:', error)
    }
}

const updateAllThumbnails = async () => {
    if (!props.originalImage || isUpdatingThumbnails.value) return

    isUpdatingThumbnails.value = true
    try {
        for (const lut of luts.value) {
            await handleUpdateThumbnail(lut.id)
        }
    } finally {
        isUpdatingThumbnails.value = false
    }
}

const updateCurrentThumbnail = async () => {
    if (!selectedLutId.value) return
    // For the current one, we can use the main view's processed image if available,
    // OR just run the standard update logic to be consistent.
    // Let's use the standard logic to ensure consistency (split view, etc).
    await handleUpdateThumbnail(selectedLutId.value)
}

const createThumbnail = (originalUrl: string, processedUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const imgOriginal = new Image()
        const imgProcessed = new Image()
        imgOriginal.crossOrigin = 'Anonymous'
        imgProcessed.crossOrigin = 'Anonymous'

        let loadedCount = 0
        const checkLoaded = () => {
            loadedCount++
            if (loadedCount === 2) {
                draw()
            }
        }

        imgOriginal.onload = checkLoaded
        imgProcessed.onload = checkLoaded
        imgOriginal.onerror = (e) => reject(new Error('Failed to load original image: ' + e))
        imgProcessed.onerror = (e) => reject(new Error('Failed to load processed image: ' + e))

        imgOriginal.src = originalUrl
        imgProcessed.src = processedUrl

        function draw() {
            const canvas = document.createElement('canvas')
            canvas.width = 32
            canvas.height = 32
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
            }

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Draw left half: Original image (left 50%)
            // Source: 0, 0, width/2, height
            // Dest: 0, 0, 16, 32
            ctx.drawImage(imgOriginal,
                0, 0, imgOriginal.width / 2, imgOriginal.height,
                0, 0, 16, 32
            )

            // Draw right half: Processed image (right 50%)
            // Source: width/2, 0, width/2, height
            // Dest: 16, 0, 16, 32
            ctx.drawImage(imgProcessed,
                imgProcessed.width / 2, 0, imgProcessed.width / 2, imgProcessed.height,
                16, 0, 16, 32
            )

            resolve(canvas.toDataURL('image/png'))
        }
    })
}

const updateMaskOptions = (options: any) => {
    Object.assign(maskOptions.value, options)
}


const handleSetPreviewOverlay = (data: any, component: any) => {
    emit('control-event', {
        type: 'update-data',
        detail: {
            action: 'set-preview-overlay',
            data: { data, component }
        }
    })
}

const toggleMobileMaskPreview = () => {
    if (maskPreviewPanelRef.value) {
        maskPreviewPanelRef.value.toggleMaskPreview()
    }
}

const switchToTab = (tab: string) => {
    activeMobileTab.value = tab
    if (tab !== 'lut' && tab !== 'add') {
        selectLayer(tab)
    }
}

// Lifecycle
onMounted(() => {
    loadLUTs()
    if (props.originalImage) {
        generateColorBlocks(props.originalImage)
    }
})

// Watchers
watch(() => props.originalImage, (newVal) => {
    if (newVal) {
        generateColorBlocks(newVal)
        // Reset layers when image changes
        layers.value = []
        activeLayerId.value = null
    }
})

// Watch for processed image to auto-update thumbnail if missing
watch(() => props.processedImage, async (newVal) => {
    if (newVal && selectedLutId.value) {
        const currentLut = luts.value.find(l => l.id === selectedLutId.value)
        // If the current LUT doesn't have a thumbnail, generate one automatically
        if (currentLut && !currentLut.thumbnail) {
            console.log('Auto-generating thumbnail for LUT:', currentLut.name)
            await updateCurrentThumbnail()
        }
    }
})

// Watch for external clear (e.g. if parent clears it)
watch(() => props.lutFileName, (newVal) => {
    if (!newVal) {
        selectedLutId.value = null
    }
})

// Watch for mask changes (layers or maskOptions)
watch([layers, maskOptions], () => {
    const visibleLayers = layers.value.filter(l => l.visible)
    if (visibleLayers.length > 0) {
        emit('mask-update', () => generateColorBlockMask(props.originalImage!))
    } else {
        emit('mask-update', null)
    }
}, { deep: true })

// Watch activeLayerId to sync mobile tab
watch(activeLayerId, (newId) => {
    if (props.isMobile && newId) {
        activeMobileTab.value = newId
    } else if (props.isMobile && !newId && activeMobileTab.value !== 'add') {
        // If layer deselected (or deleted) and not in add mode, go back to LUT
        activeMobileTab.value = 'lut'
    }
})

</script>

<style scoped>
/* Tailwind classes handled in template */
</style>
