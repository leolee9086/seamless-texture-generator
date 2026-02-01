<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import '@leolee9086/slider-component/dist/slider-component.css'
import { 保存当前配置, 获取预设列表, 删除指定预设, 加载字体列表 } from './WatermarkSettings.ctx'
import { buildSliderItems, createSliderHandlers } from './WatermarkSettings.utils'
import type { 水印样式, 水印配置, 水印预设, 字体信息 } from './watermark.types'
import { SAFE_FONTS } from './watermark.fonts'
import WatermarkFontSelector from './WatermarkFontSelector.vue'
import WatermarkPresetManager from './WatermarkPresetManager.vue'
import WatermarkAdvancedStyles from './WatermarkAdvancedStyles.vue'

const props = defineProps<{ config: 水印配置 }>()
const emit = defineEmits<{ 'update:config': [config: 水印配置] }>()

const 预设列表 = ref<水印预设[]>([])
const 字体列表 = ref<字体信息[]>(SAFE_FONTS)
const 字体加载中 = ref(false)
const 样式选项: { value: 水印样式; label: string }[] = [{ value: 'grid', label: '网格水印' }, { value: 'center', label: '居中水印' }]

/** @简洁函数 配置更新 */ const 更新配置 = (p: Partial<水印配置>) => emit('update:config', { ...props.config, ...p })
/** @简洁函数 文本更新 */ const 更新文本 = (e: Event) => { if (e.target instanceof HTMLInputElement) 更新配置({ 文本: e.target.value }) }
/** @简洁函数 颜色更新 */ const 更新颜色 = (e: Event) => { if (e.target instanceof HTMLInputElement) 更新配置({ 颜色: e.target.value }) }
/** @简洁函数 字体更新 */ const 更新字体 = (font: string) => 更新配置({ 字体: font })

const sliderItems = computed(() => buildSliderItems(props.config))
/** @简洁函数 滑块更新 */ const 处理滑块 = ({ id, value }: { id: string; value: number }) => createSliderHandlers(props.config, 更新配置)[id]?.(value)

const 保存 = async (name: string) => { await 保存当前配置(props.config, name); 预设列表.value = await 获取预设列表() }
const 应用 = (preset: 水印预设) => emit('update:config', { ...preset.配置 })
const 删除 = async (id: string) => { await 删除指定预设(id); 预设列表.value = await 获取预设列表() }

onMounted(async () => {
    预设列表.value = await 获取预设列表(); 字体加载中.value = true
    try { 字体列表.value = await 加载字体列表() } finally { 字体加载中.value = false }
})
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex bg-white/5 p-1 rounded-lg">
            <button v-for="o in 样式选项" :key="o.value" @click="更新配置({ 样式: o.value })" class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all" :class="config.样式 === o.value ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'">{{ o.label }}</button>
        </div>
        <input :value="config.文本" @input="更新文本" type="text" placeholder="水印文本" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
        <Slider :items="sliderItems" @updateValue="处理滑块" />
        <WatermarkFontSelector :selected-font="config.字体" :fonts="字体列表" :loading="字体加载中" @update:font="更新字体" />
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Color</span>
            <div class="flex items-center gap-2"><span class="text-xs text-white/50 font-mono">{{ config.颜色 }}</span>
                <input type="color" :value="config.颜色" @input="更新颜色" class="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0 overflow-hidden" /></div>
        </div>
        
        <!-- 高级样式设置 -->
        <details class="bg-white/5 rounded-lg border border-white/10">
            <summary class="p-3 cursor-pointer text-xs text-white/70 uppercase tracking-wider font-medium hover:text-white transition-colors">
                Advanced Styles
            </summary>
            <div class="px-3 pb-3">
                <WatermarkAdvancedStyles :config="config" @update:config="emit('update:config', $event)" />
            </div>
        </details>
        
        <WatermarkPresetManager :presets="预设列表" @save="保存" @apply="应用" @delete="删除" />
    </div>
</template>
