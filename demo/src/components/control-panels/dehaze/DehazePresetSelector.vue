<template>
    <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-white/80">
                去雾预设
            </label>
            <button @click="$emit('reset')"
                class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                :disabled="!hasAdjustments">
                <div class="i-carbon-reset"></div>
                <span>重置</span>
            </button>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4">
            <button v-for="(preset, key) in DEHAZE_PRESETS" :key="key"
                class="glass-btn text-xs py-2 px-2 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex flex-col items-center gap-1"
                :class="{ 'bg-white/20 text-white/90': currentPreset === key }"
                @click="handlePresetClick(key as DehazePreset)">
                <div class="text-lg opacity-70">
                    <div v-if="key === 'light'" class="i-carbon-sun"></div>
                    <div v-else-if="key === 'medium'" class="i-carbon-cloud"></div>
                    <div v-else-if="key === 'heavy'" class="i-carbon-fog"></div>
                    <div v-else-if="key === 'adaptive'" class="i-carbon-settings-adjust"></div>
                    <div v-else-if="key === 'spatialAdaptive'" class="i-carbon-layers"></div>
                    <div v-else-if="key === 'enhanced'" class="i-carbon-contrast"></div>
                </div>
                <span>{{ getPresetName(key as DehazePreset) }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { DEHAZE_PRESETS } from './imports'
import type { DehazePreset } from './imports'
import { getPresetName } from './dehazePanel.utils'

defineProps<{
    isMobile?: boolean
    currentPreset: DehazePreset | null
    hasAdjustments: boolean
}>()

const emit = defineEmits<{
    'reset': []
    'applyPreset': [key: DehazePreset]
}>()

const handlePresetClick = (key: DehazePreset) => {
    emit('applyPreset', key)
}
</script>
