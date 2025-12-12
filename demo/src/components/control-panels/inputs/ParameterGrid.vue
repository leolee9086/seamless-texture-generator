<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Size -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">分辨率</label>
      <select :value="size" class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @change="$emit('update:size', ($event.target as HTMLSelectElement).value)">
        <option value="1024x1024">1024×1024 (1:1)</option>
        <option value="1280x720">1280×720 (16:9)</option>
        <option value="720x1280">720×1280 (9:16)</option>
      </select>
    </div>
    <!-- Number of Images -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-white/70">生成数量</label>
      <input :value="n" type="number" min="1" step="1" class="glass-input px-2 py-1.5 text-sm rounded-lg"
        @input="$emit('update:n', Number(($event.target as HTMLInputElement).value))" />
    </div>

    <!-- Large Batch Warning & Interval Setting -->
    <div v-if="n > 4"
      class="col-span-2 flex flex-col gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <div class="flex items-center gap-2 text-yellow-500/90">
        <span class="text-xs">⚠️ 批量生成数量较大，请设置间隔</span>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-white/70">批次间隔 (毫秒)</label>
        <input :value="batchInterval" type="number" min="0" step="100" placeholder="例如: 1000"
          class="glass-input px-2 py-1.5 text-sm rounded-lg"
          @input="$emit('update:batchInterval', Number(($event.target as HTMLInputElement).value))" />
        <p class="text-[10px] text-white/40">建议设置 1000ms 以上以避免请求限制</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size: string
  n: number
  batchInterval?: number
}>()

defineEmits<{
  'update:size': [value: string]
  'update:n': [value: number]
  'update:batchInterval': [value: number]
}>()
</script>