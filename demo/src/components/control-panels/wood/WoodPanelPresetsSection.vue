<template>
    <CollapsiblePanel 
        title="Presets" 
        v-model="state.uiState.woodPanel.showPresets"
    >
        <div class="grid grid-cols-2 gap-2">
            <button
                v-for="(preset, name) in woodPresets"
                :key="name"
                @click="applyPreset(preset)"
                class="glass-btn text-xs py-2 px-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors"
            >
                {{ name }}
            </button>
        </div>
    </CollapsiblePanel>
</template>

<script setup lang="ts">
import type { WoodParams } from './imports'
import type { WoodPanelSectionsEmits } from './woodPanel.types'
import { CollapsiblePanel, useProceduralTextureState } from './imports'
import { woodPresets } from './WoodPanel.logic'

// 使用持久化状态管理
const { state } = useProceduralTextureState()

// 定义组件事件
const emit = defineEmits<WoodPanelSectionsEmits>()

const applyPreset = (preset: Partial<WoodParams>) => {
    Object.assign(state.woodParams, preset)
    emit('apply-preset', preset)
}
</script>