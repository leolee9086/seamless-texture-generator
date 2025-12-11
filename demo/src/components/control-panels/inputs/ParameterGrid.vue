<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Size -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">分辨率</label>
      <select
        :value="size"
        class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @change="$emit('update:size', ($event.target as HTMLSelectElement).value)"
      >
        <option value="1024x1024">1024×1024 (1:1)</option>
        <option value="1280x720">1280×720 (16:9)</option>
        <option value="720x1280">720×1280 (9:16)</option>
      </select>
    </div>
    <!-- Number of Images -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">生成数量</label>
      <select
        :value="n"
        class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @change="$emit('update:n', Number(($event.target as HTMLSelectElement).value))"
      >
        <option :value="1">1 张</option>
        <option :value="2">2 张</option>
        <option :value="4">4 张</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size: string
  n: number
}>()

defineEmits<{
  'update:size': [value: string]
  'update:n': [value: number]
}>()
</script>