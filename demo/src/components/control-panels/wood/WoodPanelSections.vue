<template>
    <div class="flex flex-col gap-4">
        <!-- Color Controls -->
        <WoodPanelColorSection />

        <!-- Basic Parameters -->
        <WoodPanelParamsSection
            title="Basic Parameters"
            model-value-key="showBasicParams"
            :items="basicItems"
            @update-param="handleWoodParamUpdate"
        />

        <!-- Pore Parameters -->
        <WoodPanelParamsSection
            title="Pore Parameters"
            model-value-key="showPoreParams"
            :items="poreItems"
            @update-param="handleWoodParamUpdate"
        />

        <!-- Advanced Parameters -->
        <WoodPanelParamsSection
            title="Advanced Parameters"
            model-value-key="showAdvancedParams"
            :items="advancedItems"
            @update-param="handleWoodParamUpdate"
        />

        <!-- Material Properties -->
        <WoodPanelParamsSection
            title="Material Properties"
            model-value-key="showMaterialParams"
            :items="materialItems"
            @update-param="handleWoodParamUpdate"
        />

        <!-- Presets -->
        <WoodPanelPresetsSection @apply-preset="handlePresetApplied" />
    </div>
</template>

<script setup lang="ts">
import type { WoodParams } from './imports'
import { useProceduralTextureState } from './imports'
import { basicWoodSliderItems } from './basicWoodSliderItems'
import { advancedWoodSliderItems } from './advancedWoodSliderItems'
import { poreWoodSliderItems } from './poreWoodSliderItems'
import { materialWoodSliderItems } from './materialWoodSliderItems'
import { updateWoodParam } from './woodPanel.guard'
import type { WoodPanelSectionsEmits } from './woodPanel.types'
import WoodPanelColorSection from './WoodPanelColorSection.vue'
import WoodPanelParamsSection from './WoodPanelParamsSection.vue'
import WoodPanelPresetsSection from './WoodPanelPresetsSection.vue'

// 使用持久化状态管理
const { state } = useProceduralTextureState()

// 使用导入的滑块项
const basicItems = basicWoodSliderItems(state)
const advancedItems = advancedWoodSliderItems(state)
const poreItems = poreWoodSliderItems(state)
const materialItems = materialWoodSliderItems(state)

// 定义组件事件
const emit = defineEmits<WoodPanelSectionsEmits>()

const handleWoodParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in state.woodParams) {
        updateWoodParam(state.woodParams, data)
        emit('update-param', data)
    }
}

const handlePresetApplied = (preset: Partial<WoodParams>) => {
    emit('apply-preset', preset)
}
</script>