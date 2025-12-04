<template>
    <div class="gradient-editor select-none">
        <!-- Gradient Preview Bar -->
        <div class="relative h-8 rounded-lg cursor-crosshair border border-white/10 mb-6"
            :style="{ background: gradientString }" @click.self="addStop" ref="barRef">
            <!-- Stops -->
            <div v-for="(stop, index) in sortedStops" :key="index"
                class="absolute top-0 h-full w-1 cursor-ew-resize group"
                :style="{ left: `${stop.offset * 100}%`, transform: 'translateX(-50%)' }"
                @mousedown.stop="startDrag($event, index)" @contextmenu.prevent.stop="removeStop(index)">
                <!-- Handle Visual -->
                <div
                    class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full shadow-sm group-hover:scale-125 transition-transform z-10">
                </div>

                <!-- Color Picker Trigger -->
                <div class="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div
                        class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white/20">
                    </div>
                    <div class="relative mt-0.5">
                        <input type="color" :value="stop.color"
                            @input="updateColor(index, ($event.target as HTMLInputElement).value)"
                            class="w-6 h-6 rounded overflow-hidden cursor-pointer border-0 p-0 bg-transparent" />
                    </div>
                </div>
            </div>
        </div>

        <div class="text-xs text-white/40 flex justify-between px-1">
            <span>Click bar to add stop</span>
            <span>Right-click handle to remove</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

export interface GradientStop {
    offset: number
    color: string
}

const props = defineProps<{
    modelValue: GradientStop[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: GradientStop[]): void
}>()

const barRef = ref<HTMLElement | null>(null)
const draggingIndex = ref<number | null>(null)

// Sort stops for display, but keep original index for editing if possible
// Actually, it's better to always emit sorted stops to avoid confusion
const sortedStops = computed(() => {
    return [...props.modelValue].sort((a, b) => a.offset - b.offset)
})

const gradientString = computed(() => {
    const stops = sortedStops.value.map(s => `${s.color} ${s.offset * 100}%`).join(', ')
    return `linear-gradient(to right, ${stops})`
})

const addStop = (event: MouseEvent) => {
    if (!barRef.value) return
    const rect = barRef.value.getBoundingClientRect()
    const offset = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))

    // Find two nearest stops to interpolate color
    // Simple approach: just duplicate the nearest stop or default to white
    // Better: interpolate
    const newStops = [...props.modelValue, { offset, color: '#ffffff' }]
    emit('update:modelValue', newStops)
}

const removeStop = (index: number) => {
    if (props.modelValue.length <= 2) return // Keep at least 2 stops
    const newStops = [...props.modelValue]
    // We need to find which stop in the original array corresponds to the sorted index
    // This is tricky if we sort in computed. 
    // Let's assume modelValue is always sorted by the parent or we sort it before emitting.
    // For now, let's just use the index from the sorted array if we assume modelValue IS sorted.
    // To be safe, let's find the stop object and remove it.
    const stopToRemove = sortedStops.value[index]
    const realIndex = props.modelValue.indexOf(stopToRemove)
    if (realIndex !== -1) {
        newStops.splice(realIndex, 1)
        emit('update:modelValue', newStops)
    }
}

const updateColor = (index: number, color: string) => {
    const stopToUpdate = sortedStops.value[index]
    const realIndex = props.modelValue.indexOf(stopToUpdate)
    if (realIndex !== -1) {
        const newStops = [...props.modelValue]
        newStops[realIndex] = { ...newStops[realIndex], color }
        emit('update:modelValue', newStops)
    }
}

const startDrag = (event: MouseEvent, index: number) => {
    const stopToDrag = sortedStops.value[index]
    const realIndex = props.modelValue.indexOf(stopToDrag)
    draggingIndex.value = realIndex

    window.addEventListener('mousemove', handleDrag)
    window.addEventListener('mouseup', stopDrag)
}

const handleDrag = (event: MouseEvent) => {
    if (draggingIndex.value === null || !barRef.value) return

    const rect = barRef.value.getBoundingClientRect()
    let offset = (event.clientX - rect.left) / rect.width
    offset = Math.max(0, Math.min(1, offset))

    const newStops = [...props.modelValue]
    newStops[draggingIndex.value] = { ...newStops[draggingIndex.value], offset }

    // We should probably sort them as we drag, but that might cause jumping index.
    // Let's just emit the updated offset. The parent/computed will handle sorting.
    emit('update:modelValue', newStops)
}

const stopDrag = () => {
    draggingIndex.value = null
    window.removeEventListener('mousemove', handleDrag)
    window.removeEventListener('mouseup', stopDrag)
}

</script>

<style scoped>
/* Custom styles if needed */
</style>
