<template>
  <div class="flex flex-col" :class="isMobile ? 'gap-6' : 'gap-6'">
    <!-- Tabs -->
    <TabSelector
      :active-tab="state.proceduralState.activeTab"
      :tabs="tabs"
      @tab-change="actions.handleTabChange"
    />

    <!-- Upload Tab Content -->
    <UploadTabContent
      v-if="state.proceduralState.activeTab === INPUTS_PANEL_TABS.UPLOAD"
      :is-mobile="isMobile"
      :is-processing="isProcessing"
      :original-image="originalImage"
      @load-sample="$emit('load-sample')"
      @image-upload="$emit('image-upload', $event)"
    />

    <!-- Procedural Tab Content -->
    <ProceduralTabContent
      v-else-if="state.proceduralState.activeTab === INPUTS_PANEL_TABS.PROCEDURAL"
      :is-mobile="isMobile"
      :procedural-type="state.proceduralState.proceduralType"
      :texture-types="textureTypes"
      :is-generating="state.isGenerating.value"
      @type-change="actions.handleTypeChange"
    />

    <!-- Text-to-Image Tab Content -->
    <TextToImageTabContent
      v-else-if="state.proceduralState.activeTab === INPUTS_PANEL_TABS.TEXT_TO_IMAGE"
      :is-mobile="isMobile"
      @set-image="actions.handleTextToImageSetImage"
    />

    <!-- Max Resolution Slider -->
    <MaxResolutionSlider
      :is-mobile="isMobile"
      :original-image="originalImage"
      :input-slider-items="inputSliderItems"
      @slider-update="$emit('slider-update', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { createInputsPanelContext } from './InputsPanel.ctx'
import TabSelector from './TabSelector.vue'
import UploadTabContent from './UploadTabContent.vue'
import ProceduralTabContent from './ProceduralTabContent.vue'
import MaxResolutionSlider from './MaxResolutionSlider.vue'
import TextToImageTabContent from './TextToImage/TextToImageTabContent.vue'
import { INPUTS_PANEL_TABS } from './InputsPanel.constants'

defineProps<{
  isMobile?: boolean
  isProcessing: boolean
  originalImage: string | null
  inputSliderItems: any[]
}>()

const emit = defineEmits<{
  'load-sample': []
  'image-upload': [event: Event]
  'slider-update': [data: { id: string; value: number }]
  'set-image': [imageData: string]
}>()

const textureTypes = ['Wood', 'Plain Weave', 'Plain Weave Advanced', 'Leather', 'Twill Weave', 'Velvet', 'Turing', 'Gray-Scott', 'Compositor', 'Advanced Compositor'] as const
const tabs = [INPUTS_PANEL_TABS.UPLOAD, INPUTS_PANEL_TABS.PROCEDURAL, INPUTS_PANEL_TABS.TEXT_TO_IMAGE] as const

// 创建上下文
const { state, actions } = createInputsPanelContext((event, imageData) => emit(event, imageData))
</script>
