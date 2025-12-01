<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- LUT Gallery -->
            <div class="px-4 pb-3">
                <label class="block text-sm font-medium text-white/80 mb-2">
                    LUT Library
                </label>
                <LUTGallery :luts="luts" :selected-id="selectedLutId" @trigger-upload="triggerUpload"
                    @select="handleSelectLUT" @delete="handleDeleteLUT" />

                <!-- Hidden Input -->
                <input ref="lutInputRef" type="file" accept=".cube" multiple @change="handleLUTFileChange"
                    class="hidden" />
            </div>

            <!-- Selected LUT Controls -->
            <div v-if="selectedLutId" class="px-4 pb-4 border-t border-white/5 pt-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs text-white/60">{{ selectedLutName }}</span>
                    <div class="flex gap-2">
                        <button v-if="processedImage" @click="updateThumbnail"
                            class="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                            title="Update thumbnail from current result">
                            <div class="i-carbon-image-copy text-sm"></div>
                        </button>
                        <button @click="clearSelection"
                            class="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                            title="Clear selection">
                            <div class="i-carbon-close text-sm"></div>
                        </button>
                    </div>
                </div>

                <Slider :items="lutSliderItems" @updateValue="handleSliderUpdate" />
            </div>

            <!-- LUT Status Hint -->
            <div v-if="lutEnabled && !selectedLutId" class="px-4 pb-3">
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
import { Slider } from '@leolee9086/slider-component'
import LUTGallery from './LUTGallery.vue'
import { lutDb, type LUTItem } from '../../utils/lutDb'

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
}>()

// State
const luts = ref<LUTItem[]>([])
const selectedLutId = ref<string | null>(null)
const lutInputRef = ref<HTMLInputElement>()

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
        ? 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
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

const updateThumbnail = async () => {
    if (!selectedLutId.value || !props.processedImage) {
        console.warn('Cannot update thumbnail: No LUT selected or no processed image')
        return
    }

    try {
        console.log('Updating thumbnail for LUT:', selectedLutId.value)
        const thumbnail = await createThumbnail(props.processedImage)
        await lutDb.updateLUTThumbnail(selectedLutId.value, thumbnail)
        await loadLUTs()
        console.log('Thumbnail updated successfully')
    } catch (error) {
        console.error('Failed to update thumbnail:', error)
    }
}

const createThumbnail = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
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

            ctx.drawImage(img, 0, 0, 32, 32)
            resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = (e) => reject(new Error('Failed to load image for thumbnail: ' + e))
        img.src = dataUrl
    })
}

// Lifecycle
onMounted(() => {
    loadLUTs()
})

// Watch for processed image to auto-update thumbnail if missing
watch(() => props.processedImage, async (newVal) => {
    if (newVal && selectedLutId.value) {
        const currentLut = luts.value.find(l => l.id === selectedLutId.value)
        // If the current LUT doesn't have a thumbnail, generate one automatically
        if (currentLut && !currentLut.thumbnail) {
            console.log('Auto-generating thumbnail for LUT:', currentLut.name)
            await updateThumbnail()
        }
    }
})

// Watch for external clear (e.g. if parent clears it)
watch(() => props.lutFileName, (newVal) => {
    if (!newVal) {
        selectedLutId.value = null
    }
})
</script>
