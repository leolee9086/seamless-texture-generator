<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" class="flex flex-col items-center justify-center py-12 text-white/30 gap-4">
            <div class="i-carbon-image text-4xl"></div>
            <span class="text-sm font-medium">Please select an image first</span>
        </div>

        <div v-else class="flex flex-col gap-4">
            <!-- Enable Toggle -->
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <span class="text-sm font-medium text-white/90">Enable Watermark</span>
                <button @click="toggleEnable"
                    class="w-12 h-6 rounded-full transition-colors duration-200 relative cursor-pointer"
                    :class="enableWatermark ? 'bg-blue-600' : 'bg-white/20'">
                    <div class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"
                        :class="enableWatermark ? 'translate-x-6' : 'translate-x-0'"></div>
                </button>
            </div>

            <div v-if="enableWatermark" class="flex flex-col gap-4 animate-fade-in-down">
                <!-- Configuration Controls -->
                <!-- Text Input -->
                <div class="flex flex-col gap-2">
                    <label class="text-xs text-white/50 uppercase tracking-wider font-medium pl-1">Text</label>
                    <input type="text" :value="watermarkConfig.文本" @input="updateText"
                        class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <!-- Style Toggle -->
                <div class="flex bg-white/5 p-1 rounded-lg">
                    <button @click="updateStyle('grid')"
                        class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all"
                        :class="watermarkConfig.样式 === 'grid' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'">
                        Grid Pattern
                    </button>
                    <button @click="updateStyle('center')"
                        class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all"
                        :class="watermarkConfig.样式 === 'center' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'">
                        Center Only
                    </button>
                </div>

                <!-- Sliders -->
                <Slider :items="sliderItems" @updateValue="handleSliderUpdate" />

                <!-- Color Picker -->
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Color</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-white/50 font-mono">{{ watermarkConfig.颜色 }}</span>
                        <input type="color" :value="watermarkConfig.颜色" @input="updateColor"
                            class="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0 overflow-hidden" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import { createUpdateDataEvent, 配置范围 } from './imports'
import type { 水印配置, 水印样式, ControlEvent } from './imports'

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

/** @简洁函数 更新水印配置辅助函数 */
const updateConfig = (partial: Partial<水印配置>) => {
    emit('controlEvent', createUpdateDataEvent('watermark-config-change', partial))
}

const updateText = (e: Event) => {
    const target = e.target
    if (target instanceof HTMLInputElement) {
        updateConfig({ 文本: target.value })
    }
}

/** @简洁函数 更新水印样式 */
const updateStyle = (style: 水印样式) => {
    updateConfig({ 样式: style })
}

const updateColor = (e: Event) => {
    const target = e.target
    if (target instanceof HTMLInputElement) {
        updateConfig({ 颜色: target.value })
    }
}

const sliderMap: Record<string, (val: number) => void> = {
    'wm-fontsize': (val) => updateConfig({ 字体大小: val }),
    'wm-opacity': (val) => updateConfig({ 不透明度: val }),
    'wm-spacing': (val) => updateConfig({ 网格间距: val })
}

/** @简洁函数 处理滑块更新 */
const handleSliderUpdate = ({ id, value }: { id: string; value: number }) => {
    sliderMap[id]?.(value)
}

const sliderItems = computed(() => {
    const items = [
        {
            id: 'wm-fontsize',
            label: 'Size',
            value: props.watermarkConfig.字体大小,
            min: 配置范围.字体大小.min as number,
            max: 配置范围.字体大小.max as number,
            step: 配置范围.字体大小.step as number,
            valuePosition: 'after' as const,
            showRuler: false
        },
        {
            id: 'wm-opacity',
            label: 'Opacity',
            value: props.watermarkConfig.不透明度,
            min: 配置范围.不透明度.min as number,
            max: 配置范围.不透明度.max as number,
            step: 配置范围.不透明度.step as number,
            valuePosition: 'after' as const,
            showRuler: false
        }
    ]

    if (props.watermarkConfig.样式 === 'grid') {
        items.push({
            id: 'wm-spacing',
            label: 'Spacing',
            value: props.watermarkConfig.网格间距,
            min: 配置范围.网格间距.min as number,
            max: 配置范围.网格间距.max as number,
            step: 配置范围.网格间距.step as number,
            valuePosition: 'after' as const,
            showRuler: false
        })
    }

    return items
})
</script>
