<template>
  <div v-if="error" class="p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
    <p class="text-xs text-red-300">{{ error }}</p>
  </div>
  <div v-if="status" class="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
    <p class="text-xs text-blue-300">{{ status }}</p>
  </div>
</template>

<script setup lang="ts">
const props= defineProps<{
  error?: string
  status?: string
}>()
</script>