<template>
    <button 
        @click="generateWood" 
        :disabled="isGenerating"
        class="glass-btn w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white/90 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
    >
        <div v-if="isGenerating" class="i-carbon-circle-dash animate-spin text-lg"></div>
        <div v-else class="i-carbon-magic-wand text-lg"></div>
        {{ isGenerating ? 'Generating...' : 'Generate Wood Texture' }}
    </button>
</template>

<script setup lang="ts">
import type { WoodPanelProps, WoodPanelGenerateEmits } from './woodPanel.types'

const props = defineProps<WoodPanelProps>()
const emit = defineEmits<WoodPanelGenerateEmits>()

const generateWood = () => {
    emit('generate')
}
</script>