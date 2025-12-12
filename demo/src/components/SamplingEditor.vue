<template>
    <div v-if="visible" class="fixed inset-0 z-50 bg-black flex flex-col">
        <!-- Toolbar -->
        <div
            class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
            <div class="pointer-events-auto">
                <h2 class="text-white text-lg font-bold drop-shadow-md">Select Sampling Area</h2>
                <p class="text-gray-300 text-sm drop-shadow-md">Drag corners to define area. Scroll/Drag background to
                    zoom/pan.</p>
            </div>
            <div class="flex gap-2 pointer-events-auto">
                <button @click="resetView"
                    class="px-3 py-1.5 md:px-4 md:py-2 bg-gray-700/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base">Reset
                    View</button>
                <button @click="resetPoints"
                    class="px-3 py-1.5 md:px-4 md:py-2 bg-gray-700/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base">Reset
                    Points</button>
                <button @click="cancel"
                    class="px-3 py-1.5 md:px-4 md:py-2 bg-red-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-500 transition-colors text-sm md:text-base">Cancel</button>
                <button @click="confirm"
                    class="px-3 py-1.5 md:px-4 md:py-2 bg-green-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-500 transition-colors text-sm md:text-base font-bold">Confirm</button>
            </div>
        </div>

        <!-- Konva Stage -->
        <div ref="containerRef" class="w-full h-full bg-gray-900">
            <v-stage ref="stageRef" :config="stageConfig" @wheel="handleWheel" @dragstart="handleDragStart"
                @dragend="handleDragEnd" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
                @touchend="handleTouchEnd">
                <v-layer>
                    <!-- Group for Image and Points (Zoomable/Pannable) -->
                    <!-- 
             We apply the zoom/pan transform to this group.
             Or we can apply it to the Layer.
             Actually, usually we apply it to the Stage or a main Layer/Group.
             Let's apply to a Group so we can keep UI overlays if needed (though we don't have any here).
           -->
                    <v-group ref="contentGroupRef" :config="groupConfig">
                        <!-- Background Image -->
                        <v-image :config="imageConfig" />

                        <!-- Connection Lines -->
                        <v-line :config="lineConfigWithScale" />

                        <!-- Rotation Handle Line -->
                        <v-line :config="rotationLineConfigWithScale" />
                        <!-- Rotation Handle -->
                        <v-circle :config="rotationHandleConfigWithScale" @dragmove="handleRotatorDragMove"
                            @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" />

                        <!-- Control Points -->
                        <v-circle v-for="(point, index) in points" :key="index" :config="{
                            x: point.x,
                            y: point.y,
                            radius: 10 / groupConfig.scaleX, // Inverse scale to keep handle size constant visually? Or just let it scale. Let's try constant visual size.
                            fill: 'rgba(0, 255, 0, 0.5)',
                            stroke: 'white',
                            strokeWidth: 2 / groupConfig.scaleX,
                            draggable: true,
                            hitStrokeWidth: 20 / groupConfig.scaleX
                        }" @dragmove="(e: any) => handlePointDragMoveWithScale(e, index)"
                            @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" />

                        <!-- Mid Points (For Free Rect resizing) -->
                        <v-circle v-for="(point, i) in midPoints" :key="'mid-' + i" :config="{
                            x: point.x,
                            y: point.y,
                            radius: 8 / groupConfig.scaleX,
                            fill: 'rgba(255, 255, 0, 0.8)',
                            stroke: 'white',
                            strokeWidth: 2 / groupConfig.scaleX,
                            draggable: true,
                            hitStrokeWidth: 20 / groupConfig.scaleX
                        }" @dragmove="(e: any) => handleMidPointDragMove(e, point.index)"
                            @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" />
                    </v-group>
                </v-layer>
            </v-stage>
        </div>

        <!-- Loading Overlay -->
        <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div class="text-white text-xl font-bold animate-pulse">Processing...</div>
        </div>

        <!-- Editor Controls -->
        <div
            class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl border border-gray-700 shadow-2xl flex flex-col gap-4 w-[90%] max-w-lg z-40">
            <!-- Ratio Control -->
            <div class="flex items-center justify-between gap-4">
                <span class="text-gray-400 text-xs uppercase font-bold tracking-wider">Ratio</span>
                <div class="flex gap-2 bg-gray-800 p-1 rounded-lg overflow-x-auto">
                    <button v-for="r in ratios" :key="r.label" @click="setRatio(r.value)"
                        :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap', currentRatio === r.value ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700']">
                        {{ r.label }}
                    </button>
                </div>
            </div>

            <!-- Rotation Control -->
            <div class="flex items-center gap-4">
                <span class="text-gray-400 text-xs uppercase font-bold tracking-wider w-10">Rot</span>
                <input type="range" min="-180" max="180" step="1" v-model.number="rotation" @input="handleRotationInput"
                    class="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-blue-400 transition-all" />
                <div class="flex items-center gap-2 min-w-[60px]">
                    <span class="text-white text-xs font-mono">{{ rotation }}°</span>
                    <button @click="resetRotation" class="text-gray-500 hover:text-white transition-colors"
                        title="Reset Rotation">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useSamplingEditorLogic } from './SamplingEditor.ctx'
/**@AIDONE 
*需要支持自由比例的矩形
*需要支持在自由比例模式下,通过拖动边的中点来调整矩形的大小和比例
*/
const props = defineProps<{
    visible: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'confirm', imageData: string): void
}>()

const {
    isProcessing,
    // State
    stageConfig,
    groupConfig,
    points,
    ratios,
    currentRatio,
    rotation,
    midPoints,
    // Configs
    imageConfig,
    lineConfigWithScale,
    rotationLineConfigWithScale,
    rotationHandleConfigWithScale,
    // Methods
    resetPoints,
    resetView,
    setRatio,
    handleRotationInput,
    resetRotation,
    handlePointDragMoveWithScale,
    handleRotatorDragMove,
    handleMidPointDragMove,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseEnter,
    handleMouseLeave,
    cancel,
    confirm
} = useSamplingEditorLogic(props, emit)
</script>
