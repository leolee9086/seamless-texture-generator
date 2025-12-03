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
                        <v-line :config="lineConfig" />

                        <!-- Rotation Handle Line -->
                        <v-line :config="rotationLineConfig" />
                        <!-- Rotation Handle -->
                        <v-circle :config="rotationHandleConfig" @dragmove="handleRotatorDragMove"
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
                        }" @dragmove="(e: any) => handlePointDragMove(e, index)" @mouseenter="handleMouseEnter"
                            @mouseleave="handleMouseLeave" />
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
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { warpPerspective, type Point } from '../utils/homography'
import {
    getPointsCenter,
    rotatePoint,
    rotatePointAroundOrigin,
    getDistance,
    getCenter,
    getBoundingBox,
    snapPointsToRatio,
    getNormalVector,
    getExpectedDirection
} from '../utils/geometry'
const props = defineProps<{
    visible: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'confirm', imageData: string): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<any>(null)
const isProcessing = ref(false)
const imageObj = ref<HTMLImageElement | null>(null)

// State
const stageConfig = ref({
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true // Allow panning the whole stage
})

const groupConfig = ref({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1
})



const points = ref<Point[]>([]) // TopLeft, TopRight, BottomRight, BottomLeft

// Editor State
const ratios = [
    { label: 'Free', value: 0 },
    { label: 'Original', value: -1 },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
]
const currentRatio = ref(0)
const rotation = ref(0)
let lastRotation = 0

// Initialize
watch(() => props.visible, (newVal) => {
    if (newVal) {
        nextTick(() => {
            updateStageSize()
            if (props.originalImage) {
                loadImage(props.originalImage)
            }
        })
    }
})

watch(() => props.originalImage, (newVal) => {
    if (props.visible && newVal) {
        loadImage(newVal)
    }
})

const updateStageSize = () => {
    if (containerRef.value) {
        stageConfig.value.width = containerRef.value.clientWidth
        stageConfig.value.height = containerRef.value.clientHeight
    }
}

const loadImage = (src: string) => {
    const img = new Image()
    img.onload = () => {
        imageObj.value = img
        resetView()
        resetPoints()
    }
    img.src = src
}

const resetView = () => {
    if (!imageObj.value || !containerRef.value) return

    const img = imageObj.value
    const stageW = containerRef.value.clientWidth
    const stageH = containerRef.value.clientHeight

    // Fit image to screen
    const scaleX = stageW / img.width
    const scaleY = stageH / img.height
    const scale = Math.min(scaleX, scaleY) * 0.9

    groupConfig.value = {
        x: (stageW - img.width * scale) / 2,
        y: (stageH - img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale
    }

    // Reset stage position if it was dragged
    if (stageRef.value) {
        const stage = stageRef.value.getStage()
        stage.position({ x: 0, y: 0 })
        stage.batchDraw()
    }
}

const resetPoints = () => {
    if (!imageObj.value) return
    const w = imageObj.value.width
    const h = imageObj.value.height
    const marginX = w * 0.2
    const marginY = h * 0.2

    points.value = [
        { x: marginX, y: marginY },
        { x: w - marginX, y: marginY },
        { x: w - marginX, y: h - marginY },
        { x: marginX, y: h - marginY }
    ]

    // Reset controls
    currentRatio.value = 0
    rotation.value = 0
    lastRotation = 0
}

// Aspect Ratio & Rotation Logic
const setRatio = (r: number) => {
    currentRatio.value = r
    if (r === -1) {
        if (imageObj.value) {
            snapToRatio(imageObj.value.width / imageObj.value.height)
        }
    } else if (r !== 0) {
        snapToRatio(r)
    }
}


const snapToRatio = (r: number) => {
    if (points.value.length < 4) return
    points.value = snapPointsToRatio(points.value, r, rotation.value)
}

const handleRotationInput = () => {
    const delta = rotation.value - lastRotation
    lastRotation = rotation.value

    const center = getPointsCenter(points.value)
    const rad = delta * Math.PI / 180
    points.value = points.value.map(p => rotatePoint(p, center, rad))
}

const resetRotation = () => {
    const delta = 0 - rotation.value
    rotation.value = 0
    lastRotation = 0
    const center = getPointsCenter(points.value)
    const rad = delta * Math.PI / 180
    points.value = points.value.map(p => rotatePoint(p, center, rad))
}

// Configs
const imageConfig = computed(() => ({
    image: imageObj.value,
    width: imageObj.value?.width,
    height: imageObj.value?.height
}))

const lineConfig = computed(() => {
    if (points.value.length < 4) return {}
    const p = points.value
    return {
        points: [
            p[0].x, p[0].y,
            p[1].x, p[1].y,
            p[2].x, p[2].y,
            p[3].x, p[3].y,
            p[0].x, p[0].y
        ],
        stroke: '#00ff00',
        strokeWidth: 2 / groupConfig.value.scaleX,
        closed: true,
        listening: false // Don't interfere with clicks
    }
})

const rotationLineConfig = computed(() => {
    if (points.value.length < 4) return { visible: false }
    const p0 = points.value[0]
    const p1 = points.value[1]
    const center = getCenter(p0, p1)

    // Same logic as handle to find tip
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const { nx, ny } = getNormalVector(dx, dy)
    const offset = 40 / groupConfig.value.scaleX

    const tipX = center.x + nx * offset
    const tipY = center.y + ny * offset

    return {
        points: [center.x, center.y, tipX, tipY],
        stroke: 'white',
        strokeWidth: 1 / groupConfig.value.scaleX,
        dash: [4, 4],
        listening: false
    }
})

const rotationHandleConfig = computed(() => {
    if (points.value.length < 4) return { visible: false }
    const p0 = points.value[0]
    const p1 = points.value[1]
    const center = getCenter(p0, p1)
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const { nx, ny } = getNormalVector(dx, dy)
    const offset = 40 / groupConfig.value.scaleX

    const tipX = center.x + nx * offset
    const tipY = center.y + ny * offset

    return {
        x: tipX,
        y: tipY,
        radius: 8 / groupConfig.value.scaleX,
        fill: 'white',
        stroke: '#000',
        strokeWidth: 1 / groupConfig.value.scaleX,
        draggable: true,
        hitStrokeWidth: 20 / groupConfig.value.scaleX
    }
})

// Interaction Handlers
const handleWheel = (e: any) => {
    const evt = e.evt
    evt.preventDefault()

    const stage = stageRef.value.getStage()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    const scaleBy = 1.1
    const newScale = evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

    const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale
    }

    const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
    }

    stage.scale({ x: newScale, y: newScale })
    stage.position(newPos)
    stage.batchDraw()
}

const handlePointDragMove = (e: any, index: number) => {
    const node = e.target
    const newPos = { x: node.x(), y: node.y() }

    if (currentRatio.value === 0) {
        // Free mode (Perspective)
        points.value[index] = newPos
        return
    }

    // Constrained Mode (Rectangular + Ratio)
    const oppositeIndex = (index + 2) % 4
    const oppositePoint = points.value[oppositeIndex]

    // Rotate to axis-aligned space (around origin for simplicity)
    const rad = -rotation.value * Math.PI / 180
    const rotNewPos = rotatePointAroundOrigin(newPos, rad)
    const rotOpposite = rotatePointAroundOrigin(oppositePoint, rad)

    // Calculate new dimensions
    let w = Math.abs(rotNewPos.x - rotOpposite.x)
    let h = Math.abs(rotNewPos.y - rotOpposite.y)

    // Enforce ratio
    // Enforce ratio
    let targetR = currentRatio.value
    if (targetR === -1) {
        if (imageObj.value) {
            targetR = imageObj.value.width / imageObj.value.height
        } else {
            targetR = 1 // Fallback
        }
    }

    // Determine expected direction based on index to prevent flipping
    // 0: TL (-1, -1), 1: TR (1, -1), 2: BR (1, 1), 3: BL (-1, 1) relative to center
    // Relative to opposite point:
    // 0 (TL) vs 2 (BR): dx < 0, dy < 0
    // 1 (TR) vs 3 (BL): dx > 0, dy < 0
    // 2 (BR) vs 0 (TL): dx > 0, dy > 0
    // 3 (BL) vs 1 (TR): dx < 0, dy > 0

    const { signX: expectedSignX, signY: expectedSignY } = getExpectedDirection(index)

    // If user drags past the opposite point, clamp it (or just enforce the sign)
    // To prevent flipping, we just ignore the user's drag direction if it flips, 
    // and instead project the drag onto the valid quadrant.

    // However, w and h are abs values.
    // If we just use expectedSignX/Y, we ensure the point stays on the correct side.
    // But we need to make sure w/h are not effectively zero if dragged past.
    // Actually, if dragged past, w/h will be large but we apply it in the correct direction?
    // No, if dragged past, rotNewPos.x > rotOpposite.x (for TL).
    // w = abs(diff). If we apply expectedSignX (-1), we move it to the left.
    // So if I drag TL to the right of BR by 100px. w=100.
    // New TL = BR.x - 100.
    // This means the handle will jump to the left side. This is the "bounce" behavior.
    // It is better than flipping the image.

    if (w / h > targetR) {
        h = w / targetR
    } else {
        w = h * targetR
    }

    // New aligned corner position
    const alignedNewPos = {
        x: rotOpposite.x + w * expectedSignX,
        y: rotOpposite.y + h * expectedSignY
    }

    // Reconstruct rectangle in aligned space
    // We need to update all 4 points.
    // Based on index parity:
    // Even indices (0, 2): next=(opp.x, cur.y), prev=(cur.x, opp.y)
    // Odd indices (1, 3): next=(cur.x, opp.y), prev=(opp.x, cur.y)

    const newPoints = [...points.value]

    // Rotate back to world space
    const worldNewPos = rotatePointAroundOrigin(alignedNewPos, -rad)

    newPoints[index] = worldNewPos
    newPoints[oppositeIndex] = oppositePoint // Opposite stays fixed

    // Calculate other two points
    let pNextAligned, pPrevAligned

    if (index % 2 === 0) {
        pNextAligned = { x: rotOpposite.x, y: alignedNewPos.y }
        pPrevAligned = { x: alignedNewPos.x, y: rotOpposite.y }
    } else {
        pNextAligned = { x: alignedNewPos.x, y: rotOpposite.y }
        pPrevAligned = { x: rotOpposite.x, y: alignedNewPos.y }
    }

    newPoints[(index + 1) % 4] = rotatePointAroundOrigin(pNextAligned, -rad)
    newPoints[(index + 3) % 4] = rotatePointAroundOrigin(pPrevAligned, -rad)

    points.value = newPoints
}

const handleRotatorDragMove = (e: any) => {
    const node = e.target
    const center = getPointsCenter(points.value)
    const mouseX = node.x()
    const mouseY = node.y()

    // Vector from center to mouse
    const vMouseX = mouseX - center.x
    const vMouseY = mouseY - center.y
    const angleMouse = Math.atan2(vMouseY, vMouseX)

    // Calculate new rotation
    // -90 degrees (up) corresponds to 0 rotation in our logic if we consider top edge
    // But wait, our rotation logic is:
    // rotatePoint uses `rad`.
    // If rotation is 0, top edge is horizontal. Center to top-mid is (0, -H/2).
    // atan2(0, -H/2) is -PI/2 (-90 deg).
    // So if angleMouse is -90, rotation should be 0.
    // So rotation = angleMouse + 90.

    let newRot = angleMouse * 180 / Math.PI + 90

    // Normalize to -180 to 180
    while (newRot > 180) newRot -= 360
    while (newRot < -180) newRot += 360

    const delta = newRot - rotation.value
    rotation.value = Math.round(newRot) // Round for cleaner UI
    lastRotation = rotation.value

    const rad = delta * Math.PI / 180
    points.value = points.value.map(p => rotatePoint(p, center, rad))

    // Reset node position to match computed position to avoid drift or visual glitch
    // Actually, if we don't reset, Konva keeps the dragged position.
    // But since we updated points, the computed config will update.
    // Vue-Konva should update the node position in the next tick.
    // However, during drag, Konva might not respect the prop update immediately if it's being dragged.
    // But usually it's fine.
}

const handleMouseEnter = (e: any) => {
    const stage = e.target.getStage()
    stage.container().style.cursor = 'pointer'
}

const handleMouseLeave = (e: any) => {
    const stage = e.target.getStage()
    stage.container().style.cursor = 'default'
}

// We don't need special drag start/end for points unless we want to track history
const handleDragStart = () => { }
const handleDragEnd = () => { }

// Touch Handling for Pinch-to-Zoom
let lastCenter: { x: number, y: number } | null = null
let lastDist = 0


const handleTouchStart = (e: any) => {
    const evt = e.evt
    const touches = evt.touches

    if (touches.length === 2) {
        // Stop dragging if we are pinching
        const stage = stageRef.value.getStage()
        stage.stopDrag()

        const p1 = { x: touches[0].clientX, y: touches[0].clientY }
        const p2 = { x: touches[1].clientX, y: touches[1].clientY }

        lastCenter = getCenter(p1, p2)
        lastDist = getDistance(p1, p2)
    }
}

const handleTouchMove = (e: any) => {
    const evt = e.evt
    const touches = evt.touches

    if (touches.length === 2 && lastCenter) {
        evt.preventDefault() // Prevent native scrolling

        const stage = stageRef.value.getStage()
        const p1 = { x: touches[0].clientX, y: touches[0].clientY }
        const p2 = { x: touches[1].clientX, y: touches[1].clientY }

        const newCenter = getCenter(p1, p2)
        const newDist = getDistance(p1, p2)

        // Calculate scale
        const pointTo = {
            x: (lastCenter.x - stage.x()) / stage.scaleX(),
            y: (lastCenter.y - stage.y()) / stage.scaleX()
        }

        const scale = stage.scaleX() * (newDist / lastDist)

        stage.scale({ x: scale, y: scale })

        // Calculate new position
        const newPos = {
            x: newCenter.x - pointTo.x * scale,
            y: newCenter.y - pointTo.y * scale
        }

        stage.position(newPos)
        stage.batchDraw()

        lastDist = newDist
        lastCenter = newCenter
    }
}

const handleTouchEnd = () => {
    lastCenter = null
    lastDist = 0
}

const cancel = () => {
    emit('close')
}

const confirm = async () => {
    if (!imageObj.value) return
    isProcessing.value = true

    // Allow UI to update
    setTimeout(() => {
        try {
            const img = imageObj.value!

            const p = points.value
            const topWidth = getDistance(p[0], p[1])
            const bottomWidth = getDistance(p[3], p[2])
            const leftHeight = getDistance(p[0], p[3])
            const rightHeight = getDistance(p[1], p[2])

            const width = Math.round((topWidth + bottomWidth) / 2)
            const height = Math.round((leftHeight + rightHeight) / 2)

            // Create a temporary canvas to get ImageData
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = img.width
            tempCanvas.height = img.height
            const tempCtx = tempCanvas.getContext('2d')!
            tempCtx.drawImage(img, 0, 0)
            const srcImageData = tempCtx.getImageData(0, 0, img.width, img.height)

            // Warp
            const dstImageData = warpPerspective(srcImageData, points.value, width, height)

            // Put back to canvas to get data URL
            const outCanvas = document.createElement('canvas')
            outCanvas.width = width
            outCanvas.height = height
            const outCtx = outCanvas.getContext('2d')!
            outCtx.putImageData(dstImageData, 0, 0)

            emit('confirm', outCanvas.toDataURL())
            emit('close')
        } catch (e) {
            console.error(e)
            alert('Error processing image')
        } finally {
            isProcessing.value = false
        }
    }, 10)
}

// Resize observer
let resizeObserver: ResizeObserver
onMounted(() => {
    if (containerRef.value) {
        resizeObserver = new ResizeObserver(() => {
            updateStageSize()
        })
        resizeObserver.observe(containerRef.value)
    }
})

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})
</script>
