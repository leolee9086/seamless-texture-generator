<template>
    <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
        <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Font</span>
        <select :value="selectedFont" @change="handleChange" :disabled="loading"
            class="bg-dark-700 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500 max-w-32 truncate appearance-none cursor-pointer">
            <option v-for="font in fonts" :key="font.family" :value="font.family" class="bg-dark-700 text-white">
                {{ font.fullName }}
            </option>
        </select>
    </div>
</template>

<script setup lang="ts">
import type { 字体信息 } from './watermark.types'

defineProps<{
    selectedFont: string
    fonts: 字体信息[]
    loading: boolean
}>()

const emit = defineEmits<{
    'update:font': [font: string]
}>()

/** @简洁函数 处理字体选择变更 */
function handleChange(e: Event) {
    const target = e.target
    if (target instanceof HTMLSelectElement) {
        emit('update:font', target.value)
    }
}
</script>
