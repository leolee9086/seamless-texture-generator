<template>
    <CollapsiblePanel
        :title="title"
        v-model="state.uiState.woodPanel[modelValueKey]"
    >
        <div v-for="param in items" :key="param.id">
            <Slider :items="[param]" @updateValue="handleWoodParamUpdate" />
        </div>
    </CollapsiblePanel>
</template>

<script setup lang="ts">
import { CollapsiblePanel, Slider, useProceduralTextureState } from './imports'
import type { WoodPanelParamsSectionProps, WoodPanelParamsSectionEmits } from './woodPanel.types'

const props = defineProps<WoodPanelParamsSectionProps>()
const emit = defineEmits<WoodPanelParamsSectionEmits>()

// 使用持久化状态管理
const { state } = useProceduralTextureState()

const handleWoodParamUpdate = (data: { id: string; value: number }) => {
    if (data.id in state.woodParams) {
        emit('update-param', data)
    }
}
</script>