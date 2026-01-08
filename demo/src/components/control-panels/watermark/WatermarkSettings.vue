<template>
    <div class="flex flex-col gap-3">
        <!-- 水印样式选择 -->
        <div class="flex gap-2">
            <button v-for="opt in 样式选项" :key="opt.value" @click="当前配置.样式 = opt.value" :class="[
                '水印样式按钮',
                当前配置.样式 === opt.value ? '选中' : ''
            ]">
                {{ opt.label }}
            </button>
        </div>

        <!-- 水印文本 -->
        <input v-model="当前配置.文本" type="text" placeholder="水印文本" class="文本输入框" />

        <!-- 参数滑块 -->
        <div class="参数区域">
            <label>字体大小: {{ 当前配置.字体大小 }}px</label>
            <input v-model.number="当前配置.字体大小" type="range" :min="8" :max="72" />
        </div>
        <div class="参数区域">
            <label>不透明度: {{ Math.round(当前配置.不透明度 * 100) }}%</label>
            <input v-model.number="当前配置.不透明度" type="range" :min="0.05" :max="1" :step="0.05" />
        </div>
        <div v-if="当前配置.样式 === 'grid'" class="参数区域">
            <label>网格间距: {{ 当前配置.网格间距 }}px</label>
            <input v-model.number="当前配置.网格间距" type="range" :min="50" :max="400" :step="10" />
        </div>

        <!-- 预设管理 -->
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

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 使用水印设置 } from './WatermarkSettings.ctx'
import { createUpdateDataEvent } from './imports'
import type { 水印样式 } from './watermark.types'
import type { ControlEvent } from './imports'

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

const { 当前配置, 预设列表, 保存当前配置, 应用预设, 删除指定预设 } = 使用水印设置()

defineExpose({ 当前配置 })

// 监听配置变化，发送控制事件
watch(当前配置, (新配置) => {
    emit('controlEvent', createUpdateDataEvent('watermark-config-change', { ...新配置 }))
}, { deep: true })

const 新预设名称 = ref('')
const 样式选项: { value: 水印样式; label: string }[] = [
    { value: 'grid', label: '网格水印' },
    { value: 'center', label: '居中水印' }
]

async function 保存新预设() {
    if (!新预设名称.value.trim()) return
    await 保存当前配置(新预设名称.value.trim())
    新预设名称.value = ''
}
</script>

<style scoped>
.水印样式按钮 {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #aaa;
    cursor: pointer;
    transition: all 0.2s;
}

.水印样式按钮.选中 {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: #3b82f6;
}

.文本输入框 {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
}

.参数区域 {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.参数区域 label {
    font-size: 12px;
    color: #888;
}

.参数区域 input[type="range"] {
    width: 100%;
}

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
