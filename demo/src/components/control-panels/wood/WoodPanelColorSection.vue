<template>
    <CollapsiblePanel 
        title="Colors (Gradient)" 
        v-model="state.uiState.woodPanel.showColors"
    >
        <GradientEditor v-model="state.woodParams.gradientStops" />
    </CollapsiblePanel>
</template>

<script setup lang="ts">
import { CollapsiblePanel, GradientEditor, useProceduralTextureState } from './imports'

// 使用持久化状态管理
const { state } = useProceduralTextureState()
</script>