<template>
  <div class="flex flex-col" :class="isMobile ? 'gap-6' : 'gap-6'">
    <!-- Tabs -->
    <TabSelector
      :active-tab="state.activeTab"
      :tabs="tabs"
      @tab-change="handleTabChange"
    />

    <!-- Upload Tab Content -->
    <UploadTabContent
      v-if="state.activeTab === INPUTS_PANEL_TABS.UPLOAD"
      :is-mobile="isMobile"
      :is-processing="isProcessing"
      :original-image="originalImage"
      @load-sample="$emit('load-sample')"
      @image-upload="$emit('image-upload', $event)"
    />

    <!-- Procedural Tab Content -->
    <ProceduralTabContent
      v-else-if="state.activeTab === INPUTS_PANEL_TABS.PROCEDURAL"
      :is-mobile="isMobile"
      :procedural-type="state.proceduralType"
      :texture-types="textureTypes"
      :is-generating="isGenerating"
      @type-change="handleTypeChange"
      @set-image="$emit('set-image', $event)"
    />

    <!-- Text-to-Image Tab Content -->
    <TextToImageTabContent
      v-else-if="state.activeTab === INPUTS_PANEL_TABS.TEXT_TO_IMAGE"
      :is-mobile="isMobile"
      @set-image="$emit('set-image', $event)"
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
import { ref } from 'vue'
import { useProceduralTextureState } from './imports'
import TabSelector from './TabSelector.vue'
import UploadTabContent from './UploadTabContent.vue'
import ProceduralTabContent from './ProceduralTabContent.vue'
import MaxResolutionSlider from './MaxResolutionSlider.vue'
import TextToImageTabContent from './TextToImage/TextToImageTabContent.vue'
import { INPUTS_PANEL_TABS, type InputsPanelTab } from './InputsPanel.constants'

const props = defineProps<{
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

// 使用持久化状态管理
const { state } = useProceduralTextureState()
const textureTypes = ['Wood', 'Plain Weave', 'Leather', 'Twill Weave', 'Velvet', 'Turing', 'Gray-Scott', 'Compositor'] as const
const tabs = [INPUTS_PANEL_TABS.UPLOAD, INPUTS_PANEL_TABS.PROCEDURAL, INPUTS_PANEL_TABS.TEXT_TO_IMAGE] as const
const isGenerating = ref(false)

const handleTabChange = (tab: InputsPanelTab) => {
  state.activeTab = tab
}

const handleTypeChange = (type: string) => {
  state.proceduralType = type
}
</script>
