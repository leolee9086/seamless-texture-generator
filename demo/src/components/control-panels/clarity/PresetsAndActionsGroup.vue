<template>
    <div class="border-t border-white/5 pt-3 pb-3" :class="{ 'px-4': !isMobile }">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-white/80">
                预设和操作
            </label>
            <button @click="handleResetParams"
                class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1">
                <div class="i-carbon-reset"></div>
                <span>重置</span>
            </button>
        </div>

        <!-- 预设按钮 -->
        <div class="grid grid-cols-2 gap-2 mb-3">
            <button v-for="(preset, key) in CLARITY_PRESETS" :key="key"
                @click="handleApplyPreset(key as keyof typeof CLARITY_PRESETS)"
                class="glass-btn text-xs py-2 rounded transition-colors"
                :class="currentPreset === key ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'">
                {{ preset.name }}
            </button>
        </div>

        <!-- 参数导出/导入 -->
        <div class="flex gap-2">
            <button @click="handleExportParams"
                class="glass-btn text-xs py-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors flex-1">
                导出参数
            </button>
            <button @click="handleImportParams"
                class="glass-btn text-xs py-2 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors flex-1">
                导入参数
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CLARITY_PRESETS } from './imports'

defineProps<{
    isMobile?: boolean
    currentPreset: string | null
}>()

const emit = defineEmits<{
    'reset-params': []
    'apply-preset': [presetKey: keyof typeof CLARITY_PRESETS]
    'export-params': []
    'import-params': []
}>()

// 处理重置参数
const handleResetParams = () => {
    emit('reset-params')
}

// 处理应用预设
const handleApplyPreset = (presetKey: keyof typeof CLARITY_PRESETS) => {
    emit('apply-preset', presetKey)
}

// 处理导出参数
const handleExportParams = () => {
    emit('export-params')
}

// 处理导入参数
const handleImportParams = () => {
    emit('import-params')
}
</script>