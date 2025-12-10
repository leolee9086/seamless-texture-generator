<template>
  <div class="flex flex-col gap-4">
    <CollapsiblePanel title="Colors (Gradient)" v-model="fullState.uiState.plainWeavePanel.showColors">
      <GradientEditor v-model="fullState.plainWeaveParams.gradientStops" />
    </CollapsiblePanel>
    
    <template v-for="panel in sliderPanels" :key="panel.title">
      <CollapsiblePanel :title="panel.title" :v-model="fullState.uiState.plainWeavePanel[panel.modelKey]">
        <SliderParameterGroup :slider-items="panel.items" @update-value="handleParamUpdate" />
      </CollapsiblePanel>
    </template>
    
    <CollapsiblePanel title="Presets" v-model="fullState.uiState.plainWeavePanel.showPresets">
      <PresetSelector :presets="weavePresets" @apply-preset="handleApplyPreset" />
    </CollapsiblePanel>
    
    <GenerateButton :is-generating="props.isGenerating || localIsGenerating.value" button-text="Generate Fabric Texture" @click="generate" />
  </div>
</template>

<script setup lang="ts">
import {
  GradientEditor,
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
  useProceduralTextureState
} from './imports'
import { useSliderPanels } from './PlainWeavePanel.sliders'
import { WEAVE_PRESETS } from './PlainWeavePanel.presets'
import { usePlainWeavePanel } from './usePlainWeavePanel'
import type { PlainWeavePanelProps, PlainWeavePanelEmits } from './PlainWeavePanel.types'

const props = defineProps<PlainWeavePanelProps>()
const emit = defineEmits<PlainWeavePanelEmits>()

// 获取完整状态
const { state: fullState } = useProceduralTextureState()

// 使用组合式函数提取业务逻辑
const {
  localIsGenerating,
  weavePresets,
  handleParamUpdate,
  handleApplyPreset,
  generate
} = usePlainWeavePanel(emit, WEAVE_PRESETS)

// 滑块面板配置
const sliderPanels = useSliderPanels()
</script>
