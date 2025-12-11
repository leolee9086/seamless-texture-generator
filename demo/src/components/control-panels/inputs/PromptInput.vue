<template>
  <div class="flex flex-col gap-2">
    <label class="text-xs font-medium text-white/70">提示词 (Prompt)</label>
    <textarea
      :value="modelValue"
      placeholder="例如：Cyberpunk city, neon lights, 8k resolution"
      rows="3"
      class="glass-input px-3 py-2 text-sm rounded-lg resize-none"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>