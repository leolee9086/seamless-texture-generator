<template>
    <div class="flex flex-col gap-4">
        <WoodPanelSections
            @update-param="handleWoodParamUpdate"
            @apply-preset="handlePresetApplied"
        />
        <WoodPanelGenerate
            :is-generating="isGenerating"
            @generate="generateWood"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, useProceduralTextureState } from './imports'
import { useWoodPanelLogic } from './WoodPanel.logic'
import type { WoodParams } from './imports'
import type { WoodPanelProps, WoodPanelEmits } from './woodPanel.types'
import WoodPanelSections from './WoodPanelSections.vue'
import WoodPanelGenerate from './WoodPanelGenerate.vue'

const { isGenerating } = defineProps<WoodPanelProps>()
const emit = defineEmits<WoodPanelEmits>()

// 使用持久化状态管理
const { state } = useProceduralTextureState()

// 使用提取的逻辑
const { generateWood, applyPreset } = useWoodPanelLogic(
    computed(() => state.woodParams),
    emit
)

const handleWoodParamUpdate = (data: { id: string; value: number }) => {
    // 参数更新逻辑已在 WoodPanelSections 中处理
    // 这里可以添加额外的处理逻辑，如果需要的话
}

const handlePresetApplied = (preset: Partial<WoodParams>) => {
    // 预设应用逻辑已在 WoodPanelSections 中处理
    // 这里可以添加额外的处理逻辑，如果需要的话
}
</script>
