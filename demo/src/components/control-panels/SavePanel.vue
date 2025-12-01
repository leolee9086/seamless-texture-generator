<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <button @click="$emit('save-original')" :class="saveButtonClass">
                <div :class="iconContainerClass('blue')">
                    <div class="i-carbon-image" :class="iconClass"></div>
                </div>
                <div class="flex flex-col">
                    <span :class="titleClass">Save Original</span>
                    <span :class="subtitleClass">{{ isMobile ? 'Download source' : 'Download the source image' }}</span>
                </div>
                <div v-if="!isMobile"
                    class="i-carbon-download ml-auto text-white/30 group-hover:text-white transition-colors"></div>
            </button>

            <button v-if="processedImage" @click="$emit('save-result')" :class="saveButtonClass">
                <div :class="iconContainerClass('green')">
                    <div class="i-carbon-save" :class="iconClass"></div>
                </div>
                <div class="flex flex-col">
                    <span :class="titleClass">Save Result</span>
                    <span :class="subtitleClass">{{ isMobile ? 'Download texture' : 'Download seamless texture'
                        }}</span>
                </div>
                <div v-if="!isMobile"
                    class="i-carbon-download ml-auto text-white/30 group-hover:text-white transition-colors"></div>
            </button>

            <div v-else-if="!isMobile"
                class="p-4 rounded-2xl border border-dashed border-white/10 text-center text-gray-500 text-sm">
                Generate a texture to enable saving
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    processedImage: string | null
}>()

defineEmits<{
    'save-original': []
    'save-result': []
}>()

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-4'
)

const saveButtonClass = computed(() =>
    props.isMobile
        ? 'w-full p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-left'
        : 'w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group text-left'
)

const iconContainerClass = (color: 'blue' | 'green') => {
    const size = props.isMobile ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl group-hover:scale-110 transition-transform'
    const colorClass = color === 'blue'
        ? 'bg-blue-500/20 text-blue-400'
        : 'bg-green-500/20 text-green-400'

    return `${size} ${colorClass} flex items-center justify-center`
}

const iconClass = computed(() =>
    props.isMobile ? 'text-xl' : 'text-2xl'
)

const titleClass = computed(() =>
    props.isMobile ? 'font-bold text-white text-sm' : 'font-bold text-white'
)

const subtitleClass = computed(() =>
    props.isMobile ? 'text-[10px] text-gray-400' : 'text-xs text-gray-400'
)
</script>
