<template>
    <div class="advanced-compositor-panel flex flex-col h-full bg-[#1e1e1e] text-white p-4 overflow-y-auto">
        <!-- Header -->
        <div class="header mb-4 border-b border-white/10 pb-2">
            <h2 class="text-lg font-bold flex items-center gap-2">
                <i class="i-carbon-layers mt-1" />
                Advanced Compositor
            </h2>
            <p class="text-xs text-white/50 mt-1">
                Multi-Layer Image Compositing with HSL Masking
            </p>
        </div>

        <!-- Base Image Section -->
        <div class="base-image-section mb-4 p-3 bg-black/20 rounded border border-white/5">
            <h3 class="text-xs font-bold text-white/70 mb-2 uppercase tracking-wide">Base Layer</h3>
            <div class="relative group cursor-pointer h-32 bg-white/5 rounded-lg border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all flex items-center justify-center overflow-hidden">
                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="handleBaseImageUpload" />
                
                <div v-if="!baseImage" class="text-center text-white/40 group-hover:text-white/70">
                    <i class="i-carbon-image text-2xl mb-1 block" />
                    <span class="text-xs">Click or Drop Base Image</span>
                </div>
                <img v-else :src="baseImage" class="w-full h-full object-contain" />
                
                <!-- Overlay Actions -->
                <div v-if="baseImage" class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="bg-black/60 text-white p-1 rounded hover:bg-black/80">
                        <i class="i-carbon-edit" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Preview Canvas -->
        <div class="preview-area mb-4 relative flex justify-center bg-black/40 rounded border border-white/10 p-2 min-h-[200px]">
             <!-- Only show canvas if we have something -->
            <canvas ref="canvasRef" class="max-w-full max-h-[400px] object-contain"></canvas>
            
            <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>

            <div v-if="!baseImage" class="absolute inset-0 flex items-center justify-center text-white/20 pointer-events-none">
                 <span>Preview Area</span>
            </div>

            <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-red-900/80 p-4 text-center z-20">
                <div class="text-red-200 text-sm">
                    <i class="i-carbon-warning block text-2xl mb-2 mx-auto" />
                    {{ error }}
                </div>
            </div>
        </div>

        <!-- Layers List -->
        <div class="layers-section flex-1 flex flex-col min-h-0">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs font-bold text-white/70 uppercase tracking-wide">Overlay Layers ({{ layers.length }})</h3>
                <div class="flex gap-2">
                    <button 
                        @click="triggerAddLayer"
                        :disabled="!baseImage"
                        class="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs flex items-center gap-1 transition-colors"
                    >
                        <i class="i-carbon-add-filled" /> Add Image Layer
                    </button>
                    <!-- Hidden Input for Add Layer -->
                    <input type="file" ref="layerInputRef" accept="image/*" class="hidden" @change="handleAddLayerFile" />
                </div>
            </div>

            <div class="layers-list flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AdvancedCompositorLayerItem
                    v-for="layer in layers" 
                    :key="layer.id"
                    :layer="layer"
                    :is-active="activeLayerId === layer.id"
                    :base-palette="basePalette"
                    @toggle-expand="activeLayerId = activeLayerId === layer.id ? null : layer.id"
                    @toggle-visibility="layer.visible = !layer.visible; requestUpdate()"
                    @delete="deleteLayer"
                    @update="requestUpdate"
                    @add-rule="addRuleToLayer"
                    @remove-rule="removeRule"
                    @add-rule-from-color="addRuleFromColor"
                    @replace-image="handleReplaceLayerTrigger"
                    @duplicate="(id) => { duplicateLayer(id); requestUpdate(); }"
                    @move="(id, dir) => { moveLayer(id, dir); requestUpdate(); }"
                />

                <div v-if="layers.length === 0" class="text-center py-6 text-white/20 text-xs">
                    No overlay layers yet.
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useAdvancedCompositor } from '../../../proceduralTexturing/other/AdvancedGrayscaleCompositor/useAdvancedCompositor'
import { CompositorLayer, HSLRule } from '../../../proceduralTexturing/other/AdvancedGrayscaleCompositor/types'
import AdvancedCompositorLayerItem from './AdvancedCompositorLayerItem.vue'

// Composable
const { 
    init, 
    baseImage, 
    basePalette,
    setBaseImage,
    addLayer, 
    removeLayer, 
    updateLayerRule,
    removeLayerRule,
    replaceLayerImage,
    duplicateLayer, // Destructure duplicateLayer
    moveLayer, // Destructure moveLayer
    layers, 
    isProcessing, 
    error,
    forceUpdate
} = useAdvancedCompositor()

// UI State
const canvasRef = ref<HTMLCanvasElement | null>(null)
const layerInputRef = ref<HTMLInputElement | null>(null)
const activeLayerId = ref<string | null>(null)
const replacingLayerId = ref<string | null>(null) // Track layer being replaced
let debounceTimer: any = null

onMounted(async () => {
    await init()
})

const emit = defineEmits<{
    (e: 'set-image', imageData: string): void
}>()

const requestUpdate = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        if (canvasRef.value) {
            await forceUpdate(canvasRef.value)
            // Emit result to main app
            try {
                const dataUrl = canvasRef.value.toDataURL('image/png')
                emit('set-image', dataUrl)
            } catch (e) {
                console.warn("Failed to export canvas image", e)
            }
        }
    }, 50)
}

// Handlers
const handleBaseImageUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
            if (e.target?.result) {
                await setBaseImage(e.target.result as string)
                requestUpdate()
            }
        }
        reader.readAsDataURL(file)
    }
}

const triggerAddLayer = () => {
    replacingLayerId.value = null // Ensure we are in add mode
    layerInputRef.value?.click()
}

const handleReplaceLayerTrigger = (layerId: string) => {
    replacingLayerId.value = layerId // Set mode to replace
    layerInputRef.value?.click()
}

const handleAddLayerFile = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
            if (e.target?.result) {
                const url = e.target.result as string
                
                if (replacingLayerId.value) {
                    // Replace Mode
                    await replaceLayerImage(replacingLayerId.value, url)
                    replacingLayerId.value = null
                } else {
                    // Add Mode
                    await addLayer(url)
                    // Auto expand new layer
                    setTimeout(() => {
                        const last = layers.value[layers.value.length - 1]
                        if (last) activeLayerId.value = last.id
                    }, 100)
                }
                
                requestUpdate()
            }
        }
        reader.readAsDataURL(file)
    }
    // reset input
    if (layerInputRef.value) layerInputRef.value.value = ''
}

const deleteLayer = (id: string) => {
    removeLayer(id)
    if (activeLayerId.value === id) activeLayerId.value = null
    requestUpdate()
}

const toggleLayerVisibility = (layer: CompositorLayer) => {
    layer.visible = !layer.visible
    requestUpdate()
}

const addRuleFromColor = (layerId: string, color: {h: number, s: number, l: number}, source: number = 0) => {
    const newRule: HSLRule = {
        id: Math.random().toString(36).substr(2, 9),
        hue: color.h,
        hueTolerance: 20, // Default tolerance
        saturation: color.s,
        saturationTolerance: 15,
        lightness: color.l,
        lightnessTolerance: 15,
        feather: 0.2,
        invert: false,
        maskSource: source // 0=Self, 1=Base
    }
    updateLayerRule(layerId, newRule)
    requestUpdate()
}

const addRuleToLayer = (layerId: string) => {
    const newRule: HSLRule = {
        id: Math.random().toString(36).substr(2, 9),
        hue: 0,
        hueTolerance: 30,
        saturation: 50,
        saturationTolerance: 20,
        lightness: 50,
        lightnessTolerance: 20,
        feather: 0.2,
        invert: false,
        maskSource: 0 // Default to Self
    }
    updateLayerRule(layerId, newRule)
    requestUpdate()
}

const removeRule = (layerId: string, ruleId: string) => {
    removeLayerRule(layerId, ruleId)
    requestUpdate()
}

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor; /* Use text color via class */
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
</style>
