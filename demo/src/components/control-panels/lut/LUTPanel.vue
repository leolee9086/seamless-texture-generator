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
            <LUTMobileNav :is-mobile="isMobile" :layers="layers" :active-mobile-tab="activeMobileTab"
                @switch-tab="switchToTab" />

            <!-- Main Content Area -->
            <div :class="contentContainerClass">
                <!-- LUT Gallery & Intensity (Show in 'lut' tab or on Desktop) -->
                <div v-if="!isMobile || activeMobileTab === 'lut'">
                    <LUTLibraryView :is-mobile="isMobile" :luts="luts" :selected-lut-id="selectedLutId"
                        :selected-lut-name="selectedLutName" :original-image="originalImage"
                        :processed-image="processedImage" :is-updating-thumbnails="isUpdatingThumbnails"
                        :lut-slider-items="lutSliderItems" :quantized-color-blocks="quantizedColorBlocks"
                        :common-hsl-blocks="commonHslBlocks" :layers="layers" :active-layer-id="activeLayerId"
                        @update-all-thumbnails="updateAllThumbnails" @files-selected="handleFilesSelected"
                        @select-lut="handleSelectLUT" @delete-lut="handleDeleteLUT"
                        @update-thumbnail="handleUpdateThumbnail" @update-current-thumbnail="updateCurrentThumbnail"
                        @clear-selection="clearSelection" @slider-update="handleSliderUpdate"
                        @add-color-layer="addColorLayer" @add-hsl-layer="addHslLayer" @remove-layer="removeLayer"
                        @select-layer="selectLayer" @update-layer="(id, changes) => updateLayer(id, changes)" />
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
import ColorBlockSelector from '../ColorBlockSelector.vue'
import MaskPreviewPanel from '../../previews/MaskPreviewPanel.vue'
import LUTMobileNav from './LUTMobileNav.vue'
import LUTLibraryView from './LUTLibraryView.vue'
import { type LUTItem } from '../../../utils/lutDb'
import { useColorBlockSelector } from '../../../composables/useColorBlockSelector'
import {
    加载全部LUT,
    删除LUT,
    添加LUT文件,
    更新LUT缩略图,
    批量更新缩略图,
    是图层Tab
} from './LUTPanel.utils'

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

// ==================== State ====================
const luts = ref<LUTItem[]>([])
const selectedLutId = ref<string | null>(null)
const isUpdatingThumbnails = ref(false)
const activeMobileTab = ref<string>('lut')
const maskPreviewPanelRef = ref<InstanceType<typeof MaskPreviewPanel> | null>(null)

// Color Block Selector
const colorBlockSelector = useColorBlockSelector()
const { states, generator, layerManager, maskGen, preview } = colorBlockSelector
const { quantizedColorBlocks, commonHslBlocks, layers, activeLayerId, maskOptions } = states
const { generateColorBlocks } = generator
const { addColorLayer, addHslLayer, removeLayer, selectLayer, updateLayer } = layerManager
const { generateColorBlockMask } = maskGen
const { updateMaskPreview, generateMaskPreviewImageDataUrl } = preview

// ==================== Computed ====================
const lutEnabled = computed(() => !!props.lutFileName)
const selectedLutName = computed(() => luts.value.find((l: LUTItem) => l.id === selectedLutId.value)?.name || props.lutFileName)
const lutSliderItems = computed(() => [{ id: 'lut-intensity', label: 'Intensity', value: props.lutIntensity, min: 0, max: 1, step: 0.01 }])
const emptyStateClass = computed(() => props.isMobile ? 'text-center text-white/30 py-8 text-sm' : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4')
const contentContainerClass = computed(() => props.isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5')

// ==================== Methods ====================
const loadLUTs = async () => { luts.value = await 加载全部LUT() }
const clearSelection = () => { selectedLutId.value = null; emit('clear-lut') }
const handleSliderUpdate = (data: { id: string; value: number }) => { emit('slider-update', data) }
const updateMaskOptions = (options: any) => { Object.assign(maskOptions.value, options) }
const toggleMobileMaskPreview = () => { maskPreviewPanelRef.value?.toggleMaskPreview() }

const handleFilesSelected = async (files: FileList) => {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) { await 添加LUT文件(files[i]) }
    await loadLUTs()
}

const handleSelectLUT = (lut: LUTItem) => {
    selectedLutId.value = lut.id
    emit('lut-file-change', new File([lut.file], lut.name, { type: 'text/plain' }))
}

const handleDeleteLUT = async (id: string) => {
    if (await 删除LUT(id)) {
        if (selectedLutId.value === id) clearSelection()
        await loadLUTs()
    }
}

const handleUpdateThumbnail = async (id: string) => {
    if (!props.originalImage) return
    if (await 更新LUT缩略图(id, props.originalImage, luts.value)) await loadLUTs()
}

const updateAllThumbnails = async () => {
    if (!props.originalImage || isUpdatingThumbnails.value) return
    isUpdatingThumbnails.value = true
    try { await 批量更新缩略图(props.originalImage, luts.value); await loadLUTs() }
    finally { isUpdatingThumbnails.value = false }
}

const updateCurrentThumbnail = async () => { if (selectedLutId.value) await handleUpdateThumbnail(selectedLutId.value) }

const handleSetPreviewOverlay = (data: any, component: any) => {
    emit('control-event', { type: 'update-data', detail: { action: 'set-preview-overlay', data: { data, component } } })
}

const switchToTab = (tab: string) => {
    activeMobileTab.value = tab
    if (是图层Tab(tab)) selectLayer(tab)
}

// ==================== Lifecycle ====================
onMounted(() => { loadLUTs(); if (props.originalImage) generateColorBlocks(props.originalImage) })

// ==================== Watchers ====================
watch(() => props.originalImage, (newVal) => { if (newVal) { generateColorBlocks(newVal); layers.value = []; activeLayerId.value = null } })
watch(() => props.processedImage, async (newVal) => {
    if (newVal && selectedLutId.value) {
        const currentLut = luts.value.find((l: LUTItem) => l.id === selectedLutId.value)
        if (currentLut && !currentLut.thumbnail) await updateCurrentThumbnail()
    }
})
watch(() => props.lutFileName, (newVal) => { if (!newVal) selectedLutId.value = null })
watch([layers, maskOptions], () => {
    const visibleLayers = layers.value.filter(l => l.visible)
    emit('mask-update', visibleLayers.length > 0 ? () => generateColorBlockMask(props.originalImage!) : null)
}, { deep: true })
watch(activeLayerId, (newId) => {
    if (props.isMobile && newId) activeMobileTab.value = newId
    else if (props.isMobile && !newId && activeMobileTab.value !== 'add') activeMobileTab.value = 'lut'
})
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>
