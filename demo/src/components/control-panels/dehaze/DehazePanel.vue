<template>
    <div class="flex flex-col gap-4">
        <DehazeEmptyState v-if="!originalImage" :isMobile="isMobile" />

        <div v-else :class="contentContainerClass(isMobile)">
            <DehazePresetSelector :isMobile="isMobile" :currentPreset="currentPreset" :hasAdjustments="hasAdjustments"
                @reset="resetDehaze" @applyPreset="applyPreset" />

            <DehazeBasicParams :isMobile="isMobile" :items="basicSliderItems" @updateValue="handleBasicSliderUpdate" />

            <DehazeAdvancedParams :isMobile="isMobile" :showAdvanced="showAdvanced" :items="advancedSliderItems"
                :adaptiveMode="dehazeParams.adaptiveMode" :spatialAdaptiveMode="dehazeParams.spatialAdaptiveMode"
                :enableEnhancement="dehazeParams.enableEnhancement" @toggleAdvanced="showAdvanced = !showAdvanced"
                @updateValue="handleAdvancedSliderUpdate" @update:adaptiveMode="dehazeParams.adaptiveMode = $event"
                @update:spatialAdaptiveMode="dehazeParams.spatialAdaptiveMode = $event"
                @update:enableEnhancement="dehazeParams.enableEnhancement = $event" />

            <DehazeEnhancementParams v-if="dehazeParams.enableEnhancement" :isMobile="isMobile"
                :items="enhancementSliderItems" @updateValue="handleEnhancementSliderUpdate" />

            <DehazeProcessingIndicator v-if="isProcessing" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDehazePanel } from './useDehazePanel'
import { BasicParamsUIDefine, AdvancedParamsUIDefine, EnhancementParamsUIDefine } from './imports'
import { createSliderItemsComputed } from './dehazeControlItems'
import { contentContainerClass } from './dehazePanel.utils'
import type { ControlEvent } from './imports'

import DehazeEmptyState from './DehazeEmptyState.vue'
import DehazePresetSelector from './DehazePresetSelector.vue'
import DehazeBasicParams from './DehazeBasicParams.vue'
import DehazeAdvancedParams from './DehazeAdvancedParams.vue'
import DehazeEnhancementParams from './DehazeEnhancementParams.vue'
import DehazeProcessingIndicator from './DehazeProcessingIndicator.vue'

defineProps<{
    isMobile?: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

const {
    dehazeParams,
    currentPreset,
    showAdvanced,
    isProcessing,
    hasAdjustments,
    handleBasicSliderUpdate,
    handleAdvancedSliderUpdate,
    handleEnhancementSliderUpdate,
    applyPreset,
    resetDehaze
} = useDehazePanel((event: 'controlEvent', data: ControlEvent) => {
    emit(event, data)
})

const basicSliderItems = createSliderItemsComputed(BasicParamsUIDefine, dehazeParams)
const advancedSliderItems = createSliderItemsComputed(AdvancedParamsUIDefine, dehazeParams)
const enhancementSliderItems = createSliderItemsComputed(EnhancementParamsUIDefine, dehazeParams)
</script>