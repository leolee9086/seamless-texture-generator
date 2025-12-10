<template>
  <div v-if="originalImage" :class="sliderContainerClass">
    <Slider :items="inputSliderItems" @updateValue="$emit('slider-update', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from './imports'

const props = defineProps<{
  isMobile?: boolean
  originalImage: string | null
  inputSliderItems: any[]
}>()

defineEmits<{
  'slider-update': [data: { id: string; value: number }]
}>()

const sliderContainerClass = computed(() =>
  props.isMobile
    ? 'bg-white/5 rounded-2xl border border-white/5'
    : 'bg-white/5 rounded-2xl border border-white/5'
)
</script>