<template>
  <div class="flex flex-col gap-4">
    <CollapsiblePanel title="Fabrics Colors" v-model="fullState.uiState.plainWeaveAdvancedPanel.showColors">
      <div class="flex flex-col gap-4 p-2 bg-gray-800 rounded">
        <div class="flex items-center justify-between">
          <label class="text-gray-300 text-sm font-medium">Warp Color (Vertical)</label>
          <div class="flex items-center gap-2">
            <input type="color" v-model="fullState.plainWeaveAdvancedParams.warpColor" @change="debouncedGenerate"
              class="w-8 h-8 cursor-pointer border-none bg-transparent" />
            <span class="text-xs text-gray-400 font-mono">{{ fullState.plainWeaveAdvancedParams.warpColor }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <label class="text-gray-300 text-sm font-medium">Weft Color (Horizontal)</label>
          <div class="flex items-center gap-2">
            <input type="color" v-model="fullState.plainWeaveAdvancedParams.weftColor" @change="debouncedGenerate"
              class="w-8 h-8 cursor-pointer border-none bg-transparent" />
            <span class="text-xs text-gray-400 font-mono">{{ fullState.plainWeaveAdvancedParams.weftColor }}</span>
          </div>
        </div>
      </div>
    </CollapsiblePanel>

    <template v-for="panel in sliderPanels" :key="panel.title">
      <CollapsiblePanel :title="panel.title" :v-model="fullState.uiState.plainWeaveAdvancedPanel[panel.modelKey]">
        <SliderParameterGroup :slider-items="panel.items" @update-value="handleParamUpdate" />
      </CollapsiblePanel>
    </template>

    <CollapsiblePanel title="Presets" v-model="fullState.uiState.plainWeaveAdvancedPanel.showPresets">
      <PresetSelector :presets="weavePresets" @apply-preset="handleApplyPreset" />
    </CollapsiblePanel>

    <GenerateButton :is-generating="props.isGenerating || localIsGenerating" button-text="Generate Advanced Weave"
      @click="generate" />
  </div>
</template>

<script setup lang="ts">
import {
  CollapsiblePanel,
  SliderParameterGroup,
  PresetSelector,
  GenerateButton,
  useProceduralTextureState
} from './imports'
import { useSliderPanels } from './PlainWeaveAdvancedPanel.sliders'
import { WEAVE_PRESETS } from './PlainWeaveAdvancedPanel.presets'
import { usePlainWeaveAdvancedPanel } from './usePlainWeaveAdvancedPanel'


const props = defineProps<{
  isGenerating: boolean
}>()
const emit = defineEmits<{
  'set-image': [imageData: string]
}>()

// 获取完整状态
const { state: fullState } = useProceduralTextureState()

// 使用组合式函数提取业务逻辑
const {
  state: {
    localIsGenerating,
    weavePresets
  },
  actions: {
    handleParamUpdate,
    handleApplyPreset,
    generate,
    debouncedGenerate
  }
} = usePlainWeaveAdvancedPanel(emit, WEAVE_PRESETS)

// 滑块面板配置
const sliderPanels = useSliderPanels()
</script>
