<template>
  <template v-for="param in sliderItems" :key="param.id">
    <Slider :items="[param]" @updateValue="handleUpdate" />
  </template>
</template>

<script setup lang="ts">
import { Slider, SliderItem } from '@leolee9086/slider-component'
defineProps<
  {
    sliderItems: SliderItem[]
  }>()
const emit = defineEmits<{
  'update-value': [data: { id: string; value: number }]
}>()

const handleUpdate = (data: { id: string; value: number }) => {
  emit('update-value', data)
}
</script>