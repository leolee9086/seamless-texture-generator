<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-medium text-white/60">Type</span>
    <div
      class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5 hover:scrollbar-thumb-white/30"
      @wheel="handleHorizontalScroll"
      style="scrollbar-width: thin; -webkit-overflow-scrolling: touch; flex-wrap: nowrap; padding-bottom: 8px;"
    >
      <button
        v-for="type in textureTypes"
        :key="type"
        @click="$emit('type-change', type)"
        class="glass-btn py-2 px-4 text-xs font-medium rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0"
        :class="activeType === type ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'"
      >
        {{ type }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { horizontalScroll } from './imports'

defineProps<{
  activeType: string
  textureTypes: readonly string[]
}>()

defineEmits<{
  'type-change': [type: string]
}>()

const handleHorizontalScroll = (event: WheelEvent) => {
  horizontalScroll(event)
}
</script>