<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-image text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- 原图保存按钮 -->
            <button @click="$emit('save-original')" :class="saveButtonClass">
                <div :class="iconContainerClass('blue')">
                    <div class="i-carbon-image" :class="iconClass"></div>
                </div>
                <div class="flex flex-col">
                    <span :class="titleClass">Save Original</span>
                    <span :class="subtitleClass">{{ isMobile ? 'Download source' : 'Download the source image' }}</span>
                </div>
                <div v-if="!isMobile"
                    class="i-carbon-download ml-auto text-white/30 group-hover:text-white transition-colors"></div>
            </button>

            <!-- 处理结果保存区域 -->
            <template v-if="processedImage">
                <!-- 无水印保存 -->
                <button @click="$emit('save-result')" :class="saveButtonClass">
                    <div :class="iconContainerClass('green')">
                        <div class="i-carbon-save" :class="iconClass"></div>
                    </div>
                    <div class="flex flex-col">
                        <span :class="titleClass">Save Without Watermark</span>
                        <span :class="subtitleClass">{{ isMobile ? 'Clean texture' : 'Download clean texture' }}</span>
                    </div>
                    <div v-if="!isMobile"
                        class="i-carbon-download ml-auto text-white/30 group-hover:text-white transition-colors"></div>
                </button>

                <!-- 带水印保存 -->
                <button @click="保存带水印图片" :class="saveButtonClass">
                    <div :class="iconContainerClass('purple')">
                        <div class="i-carbon-text-annotation-toggle" :class="iconClass"></div>
                    </div>
                    <div class="flex flex-col">
                        <span :class="titleClass">Save With Watermark</span>
                        <span :class="subtitleClass">{{ isMobile ? 'Watermarked' : 'Download with watermark' }}</span>
                    </div>
                    <div v-if="!isMobile"
                        class="i-carbon-download ml-auto text-white/30 group-hover:text-white transition-colors"></div>
                </button>
            </template>

            <div v-else-if="!isMobile"
                class="p-4 rounded-2xl border border-dashed border-white/10 text-center text-gray-500 text-sm">
                Generate a texture to enable saving
            </div>

            <!-- 水印设置区域 -->
            <div class="水印设置区域">
                <div class="区域标题">Watermark Settings</div>
                <WatermarkSettings ref="watermarkSettingsRef" @control-event="转发控制事件" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import WatermarkSettings from './watermark/WatermarkSettings.vue'
import { 添加水印到图片 } from './watermark/watermark.renderer'
import type { 水印配置 } from './watermark/watermark.types'
import type { ControlEvent } from './imports'

const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    processedImage: string | null
}>()

const emit = defineEmits<{
    'save-original': []
    'save-result': []
    'save-watermarked': [base64: string]
    'controlEvent': [event: ControlEvent]
}>()

/** @简洁函数 转发子组件控制事件到父组件 */
const 转发控制事件 = (event: ControlEvent): void => emit('controlEvent', event)

const watermarkSettingsRef = ref<InstanceType<typeof WatermarkSettings> | null>(null)

async function 保存带水印图片() {
    if (!props.processedImage) return
    const config = watermarkSettingsRef.value?.当前配置 as 水印配置 | undefined
    if (!config) return

    const watermarked = await 添加水印到图片(props.processedImage, config)
    emit('save-watermarked', watermarked)
}

const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-4'
)

const saveButtonClass = computed(() =>
    props.isMobile
        ? 'w-full p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-left'
        : 'w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group text-left'
)

const iconContainerClass = (color: 'blue' | 'green' | 'purple') => {
    const size = props.isMobile ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl group-hover:scale-110 transition-transform'
    const colorMap = {
        blue: 'bg-blue-500/20 text-blue-400',
        green: 'bg-green-500/20 text-green-400',
        purple: 'bg-purple-500/20 text-purple-400'
    }
    return `${size} ${colorMap[color]} flex items-center justify-center`
}

const iconClass = computed(() => props.isMobile ? 'text-xl' : 'text-2xl')
const titleClass = computed(() => props.isMobile ? 'font-bold text-white text-sm' : 'font-bold text-white')
const subtitleClass = computed(() => props.isMobile ? 'text-[10px] text-gray-400' : 'text-xs text-gray-400')
</script>

<style scoped>
.水印设置区域 {
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.区域标题 {
    font-size: 14px;
    font-weight: 600;
    color: #999;
    margin-bottom: 12px;
}
</style>
