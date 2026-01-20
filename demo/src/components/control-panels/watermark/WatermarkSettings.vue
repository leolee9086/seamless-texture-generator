<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Slider, SliderItem } from '@leolee9086/slider-component'
import '@leolee9086/slider-component/dist/slider-component.css'
import { 保存当前配置, 获取预设列表, 删除指定预设 } from './WatermarkSettings.ctx'
import { 配置范围 } from './watermark.constants'
import type { 水印样式, 水印配置, 水印预设 } from './watermark.types'

const props = defineProps<{
    config: 水印配置
}>()

const emit = defineEmits<{
    'update:config': [config: 水印配置]
}>()

const 预设列表 = ref<水印预设[]>([])
const 新预设名称 = ref('')

const 样式选项: { value: 水印样式; label: string }[] = [
    { value: 'grid', label: '网格水印' },
    { value: 'center', label: '居中水印' }
]

function 更新配置(partial: Partial<水印配置>) {
    emit('update:config', { ...props.config, ...partial })
}

/** @简洁函数 更新文本输入 */
function 更新文本(e: Event) {
    const target = e.target
    if (target instanceof HTMLInputElement) {
        更新配置({ 文本: target.value })
    }
}

/** @简洁函数 更新颜色选择 */
function 更新颜色(e: Event) {
    const target = e.target
    if (target instanceof HTMLInputElement) {
        更新配置({ 颜色: target.value })
    }
}

const sliderMap: Record<string, (val: number) => void> = {
    'wm-fontsize': (val) => 更新配置({ 字体大小: val }),
    'wm-opacity': (val) => 更新配置({ 不透明度: val }),
    'wm-spacing': (val) => 更新配置({ 网格间距: val })
}

function 处理滑块更新({ id, value }: { id: string; value: number }) {
    sliderMap[id]?.(value)
}

const sliderItems = computed((): SliderItem[] => {
    const items: SliderItem[] = [
        {
            id: 'wm-fontsize',
            label: 'Size',
            value: props.config.字体大小,
            min: 配置范围.字体大小.min,
            max: 配置范围.字体大小.max,
            step: 配置范围.字体大小.step,
            valuePosition: 'after' as const,
            showRuler: false
        },
        {
            id: 'wm-opacity',
            label: 'Opacity',
            value: props.config.不透明度,
            min: 配置范围.不透明度.min,
            max: 配置范围.不透明度.max,
            step: 配置范围.不透明度.step,
            valuePosition: 'after' as const,
            showRuler: false
        }
    ]

    if (props.config.样式 === 'grid') {
        items.push({
            id: 'wm-spacing',
            label: 'Spacing',
            value: props.config.网格间距,
            min: 配置范围.网格间距.min,
            max: 配置范围.网格间距.max,
            step: 配置范围.网格间距.step,
            valuePosition: 'after' as const,
            showRuler: false
        })
    }

    return items
})

async function 保存新预设() {
    if (!新预设名称.value.trim()) return
    await 保存当前配置(props.config, 新预设名称.value.trim())
    新预设名称.value = ''
    await 加载预设列表()
}

function 应用预设(预设: 水印预设) {
    emit('update:config', { ...预设.配置 })
}

async function 删除指定预设(id: string) {
    await 删除指定预设(id)
    await 加载预设列表()
}

async function 加载预设列表() {
    预设列表.value = await 获取预设列表()
}

onMounted(加载预设列表)
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex bg-white/5 p-1 rounded-lg">
            <button v-for="opt in 样式选项" :key="opt.value" @click="更新配置({ 样式: opt.value })"
                class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all"
                :class="config.样式 === opt.value ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'">
                {{ opt.label }}
            </button>
        </div>

        <input :value="config.文本" @input="更新文本" type="text" placeholder="水印文本"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />

        <Slider :items="sliderItems" @updateValue="处理滑块更新" />

        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <span class="text-xs text-white/50 uppercase tracking-wider font-medium">Color</span>
            <div class="flex items-center gap-2">
                <span class="text-xs text-white/50 font-mono">{{ config.颜色 }}</span>
                <input type="color" :value="config.颜色" @input="更新颜色"
                    class="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0 overflow-hidden" />
            </div>
        </div>

        <div class="预设区域">
            <div class="flex gap-2 items-center">
                <input v-model="新预设名称" type="text" placeholder="预设名称" class="预设名称输入" />
                <button @click="保存新预设" class="保存预设按钮">保存</button>
            </div>
            <div v-if="预设列表.length" class="预设列表">
                <div v-for="预设 in 预设列表" :key="预设.id" class="预设项">
                    <span @click="应用预设(预设)" class="预设名称">{{ 预设.名称 }}</span>
                    <button @click="删除指定预设(预设.id)" class="删除按钮">×</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.预设区域 {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.预设名称输入 {
    flex: 1;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 12px;
}

.保存预设按钮 {
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    font-size: 12px;
    cursor: pointer;
}

.预设列表 {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.预设项 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
}

.预设名称 {
    cursor: pointer;
    color: #ccc;
    font-size: 12px;
}

.预设名称:hover {
    color: #fff;
}

.删除按钮 {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 16px;
}

.删除按钮:hover {
    color: #ef4444;
}
</style>
