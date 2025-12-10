<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass(isMobile || false)">
            <div class="i-carbon-color-palette text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass(isMobile || false)">
            <!-- 滤波参数组 -->
            <FilterParamsGroup
                :isMobile="isMobile"
                :clarityParams="clarityParams"
                @update-value="handleParamUpdate"
            />

            <!-- 增强参数组 -->
            <EnhancementParamsGroup
                :isMobile="isMobile"
                :clarityParams="clarityParams"
                @update-value="handleParamUpdate"
            />

            <!-- 预设和操作 -->
            <PresetsAndActionsGroup
                :isMobile="isMobile"
                :currentPreset="currentPreset"
                @reset-params="resetParams"
                @apply-preset="applyPreset"
                @export-params="handleExportParams"
                @import-params="handleImportParams"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { CLARITY_PRESETS } from './imports'
import { useClarityPanel } from './useClarityPanel'
import FilterParamsGroup from './FilterParamsGroup.vue'
import EnhancementParamsGroup from './EnhancementParamsGroup.vue'
import PresetsAndActionsGroup from './PresetsAndActionsGroup.vue'
import type { ControlEvent } from './imports'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// 使用 Composable
const {
    clarityParams,
    currentPreset,
    emptyStateClass,
    contentContainerClass,
    handleParamUpdate,
    resetParams,
    applyPreset,
    handleImportParams,
    handleExportParams
} = useClarityPanel((event: 'controlEvent', data: ControlEvent) => {
    emit(event, data)
})

</script>