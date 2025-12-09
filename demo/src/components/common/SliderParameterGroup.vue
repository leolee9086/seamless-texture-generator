<template>
  <div v-for="param in sliderItems" :key="param.id">
    <Slider :items="[param]" @updateValue="handleUpdate" />
  </div>
</template>

<script setup lang="ts">
import { Slider } from '@leolee9086/slider-component'

interface SliderItem {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  valuePosition: 'before' | 'after'
  showRuler: boolean
}

interface Props {
  sliderItems: SliderItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update-value': [data: { id: string; value: number }]
}>()

const handleUpdate = (data: { id: string; value: number }) => {
  emit('update-value', data)
}
</script>