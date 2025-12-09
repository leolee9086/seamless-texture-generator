<template>
  <div class="grid grid-cols-2 gap-2">
    <button 
      v-for="(preset, name) in presets" 
      :key="name" 
      @click="handlePresetClick(preset)"
      class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors"
    >
      {{ name }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  presets: Record<string, any>
}

defineProps<Props>()

const emit = defineEmits<{
  'apply-preset': [preset: any]
}>()

const handlePresetClick = (preset: any) => {
  emit('apply-preset', preset)
}
</script>