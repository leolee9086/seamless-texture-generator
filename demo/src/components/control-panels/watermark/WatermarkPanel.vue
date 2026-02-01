<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" class="flex flex-col items-center justify-center py-12 text-white/30 gap-4">
            <div class="i-carbon-image text-4xl"></div>
            <span class="text-sm font-medium">Please select an image first</span>
        </div>

        <div v-else class="flex flex-col gap-4">
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div class="flex items-center gap-2">
                    <div class="i-carbon-stamp text-lg text-white/70"></div>
                    <span class="text-sm font-medium text-white/90">Enable Watermark</span>
                </div>
                <button @click="toggleEnable"
                    class="w-12 h-6 rounded-full transition-colors duration-200 relative cursor-pointer"
                    :class="enableWatermark ? 'bg-blue-600' : 'bg-white/20'">
                    <div class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"
                        :class="enableWatermark ? 'translate-x-6' : 'translate-x-0'"></div>
                </button>
            </div>

            <div v-if="enableWatermark">
                <WatermarkSettings :config="watermarkConfig" @update:config="更新配置" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import WatermarkSettings from './WatermarkSettings.vue'
import { createUpdateDataEvent } from './imports'
import type { ControlEvent } from './imports'
import type { 水印配置 } from './watermark.types'

const props = defineProps<{
    originalImage: string | null
    watermarkConfig: 水印配置
    enableWatermark: boolean
}>()

const emit = defineEmits<{
    controlEvent: [event: ControlEvent]
}>()

/** @简洁函数 切换水印启用状态 */
const toggleEnable = () => {
    emit('controlEvent', createUpdateDataEvent('watermark-enable-change', !props.enableWatermark))
}

/** @简洁函数 更新水印配置 */
const 更新配置 = (config: 水印配置) => {
    emit('controlEvent', createUpdateDataEvent('watermark-config-change', config))
}
</script>
