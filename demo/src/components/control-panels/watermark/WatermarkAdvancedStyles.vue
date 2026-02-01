<script setup lang="ts">
import { computed } from 'vue'
import type { 水印配置, 文本样式配置 } from './watermark.types'
import { FONT_WEIGHT_OPTIONS, 默认文本样式配置 } from './watermark.constants'
import { isValidFontWeight } from './watermark.guard'

const props = defineProps<{ config: 水印配置 }>()
const emit = defineEmits<{ 'update:config': [config: 水印配置] }>()

const 当前文本样式 = computed(() => props.config.文本样式 ?? 默认文本样式配置)

/** @简洁函数 更新文本样式 */
const 更新文本样式 = (partial: Partial<文本样式配置>) => {
    const 新样式 = { ...当前文本样式.value, ...partial }
    emit('update:config', { ...props.config, 文本样式: 新样式 })
}

/** @简洁函数 字重更新 */
const 更新字重 = (e: Event) => {
    if (e.target instanceof HTMLSelectElement && isValidFontWeight(e.target.value)) {
        更新文本样式({ 字重: e.target.value })
    }
}

/** @简洁函数 斜体切换 */
const 切换斜体 = () => {
    更新文本样式({ 斜体: !当前文本样式.value.斜体 })
}

/** @简洁函数 描边颜色更新 */
const 更新描边颜色 = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        更新文本样式({ 描边颜色: e.target.value })
    }
}
</script>

<template>
    <div class="space-y-3">
        <!-- 字重选择 -->
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Font Weight</span>
            <select 
                :value="当前文本样式.字重" 
                @change="更新字重"
                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            >
                <option 
                    v-for="option in FONT_WEIGHT_OPTIONS" 
                    :key="option.value" 
                    :value="option.value"
                    class="bg-gray-800 text-white"
                >
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- 斜体开关 -->
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Italic</span>
            <button 
                @click="切换斜体"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="当前文本样式.斜体 ? 'bg-blue-600' : 'bg-white/20'"
            >
                <span 
                    class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
                    :class="当前文本样式.斜体 ? 'translate-x-5' : 'translate-x-1'"
                />
            </button>
        </div>

        <!-- 描边颜色选择 -->
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Stroke Color</span>
            <div class="flex items-center gap-2">
                <span class="text-xs text-white/50 font-mono">{{ 当前文本样式.描边颜色 }}</span>
                <input 
                    type="color" 
                    :value="当前文本样式.描边颜色" 
                    @input="更新描边颜色"
                    class="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0 overflow-hidden" 
                />
            </div>
        </div>
    </div>
</template>