<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-white/60">{{ title }}</span>
      <button @click="toggleVisibility" class="text-white/40 hover:text-white/60 transition-colors">
        <div class="i-carbon-chevron-down text-sm transition-transform"
            :class="{ 'rotate-180': isVisible }"></div>
      </button>
    </div>
    <div v-show="isVisible" class="flex flex-col gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isVisible = ref(props.modelValue)

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
  emit('update:modelValue', isVisible.value)
}

// 监听外部modelValue变化
watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue
})
</script>