<template>
  <div class="flex p-1 bg-white/5 rounded-xl">
    <button
      v-for="tab in tabs"
      :key="tab"
      @click="$emit('tab-change', tab)"
      class="glass-btn flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
      :class="activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'"
    >
      {{ tab }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { INPUTS_PANEL_TABS, type InputsPanelTab } from './InputsPanel.constants'

defineProps<{
  activeTab: InputsPanelTab
  tabs: readonly InputsPanelTab[]
}>()

defineEmits<{
  'tab-change': [tab: InputsPanelTab]
}>()
</script>