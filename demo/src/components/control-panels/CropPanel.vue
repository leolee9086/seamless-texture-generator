<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else class="flex flex-col gap-4">
            <div :class="panelClass">
                <p :class="descriptionClass">
                    {{ isMobile ? 'Select area for texture generation.' : `Define a quadrilateral area on your image to
                    be transformed into a seamless texture.` }}
                </p>
                <button @click="$emit('open-sampling-editor')" :class="buttonClass">
                    <div :class="iconClass"></div>
                    <span>Open Crop Editor</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
}>()

defineEmits<{
    'open-sampling-editor': []
}>()

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const panelClass = computed(() =>
    props.isMobile
        ? 'bg-white/5 rounded-2xl p-5 border border-white/5'
        : 'bg-white/5 rounded-2xl p-6 border border-white/5'
)

const descriptionClass = computed(() =>
    props.isMobile
        ? 'text-sm text-gray-300 mb-4'
        : 'text-sm text-gray-300 mb-6 leading-relaxed'
)

const buttonClass = computed(() =>
    props.isMobile
        ? 'w-full py-3.5 rounded-xl bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2'
        : 'w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 group'
)

const iconClass = computed(() =>
    props.isMobile
        ? 'i-carbon-crop text-lg'
        : 'i-carbon-crop text-xl group-hover:rotate-90 transition-transform'
)
</script>
