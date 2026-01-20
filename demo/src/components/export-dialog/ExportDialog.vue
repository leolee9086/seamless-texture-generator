<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="$emit('cancel')">
        <div
            class="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col font-sans text-white/90 overflow-hidden">
            <!-- Header -->
            <div
                class="header h-14 flex items-center justify-between px-6 border-b border-white/10 shrink-0 bg-white/5">
                <h2 class="text-lg font-medium flex items-center gap-2">
                    <span>📤</span>
                    <span>导出图片</span>
                    <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">{{ selectedCount }} 张</span>
                </h2>
                <button
                    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/50"
                    @click="$emit('cancel')">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- 1. Presets -->
                <section>
                    <h3 class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">导出预设</h3>
                    <div class="grid grid-cols-1 gap-2">
                        <div v-for="presetItem in 内置导出预设" :key="presetItem.id"
                            class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                            :class="localPreset.id === presetItem.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'"
                            @click="selectPreset(presetItem)">
                            <div class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                                :class="localPreset.id === presetItem.id ? 'border-blue-500' : 'border-white/30'">
                                <div v-if="localPreset.id === presetItem.id" class="w-2 h-2 rounded-full bg-blue-500">
                                </div>
                            </div>
                            <div class="flex-1">
                                <div class="text-sm font-medium">{{ presetItem.name }}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 2. Export Mode -->
                <section>
                    <h3 class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">导出方式</h3>
                    <div class="flex gap-4">
                        <label
                            class="flex-1 flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all"
                            :class="mode === 'individual' ? 'ring-1 ring-blue-500 border-blue-500/50' : ''">
                            <input type="radio" v-model="mode" value="individual" class="hidden">
                            <span class="text-lg">📄</span>
                            <div>
                                <div class="text-sm font-medium">逐一下载</div>
                                <div class="text-xs text-white/50">每张图片单独保存</div>
                            </div>
                        </label>
                        <label
                            class="flex-1 flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all"
                            :class="mode === 'zip' ? 'ring-1 ring-blue-500 border-blue-500/50' : ''">
                            <input type="radio" v-model="mode" value="zip" class="hidden">
                            <span class="text-lg">📦</span>
                            <div>
                                <div class="text-sm font-medium">ZIP 打包</div>
                                <div class="text-xs text-white/50">打包为一个压缩文件</div>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- 3. Settings (Customized) -->
                <div class="space-y-4 border-t border-white/10 pt-4">
                    <!-- Format & Quality -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs text-white/50 mb-1">格式</label>
                            <select v-model="localPreset.format"
                                class="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none">
                                <option value="webp">WebP</option>
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-white/50 mb-1">
                                质量: {{ Math.round(localPreset.quality * 100) }}%
                            </label>
                            <input type="range" v-model.number="localPreset.quality" min="0.1" max="1.0" step="0.05"
                                class="w-full accent-blue-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer">
                        </div>
                    </div>

                    <!-- Naming -->
                    <div>
                        <label class="block text-xs text-white/50 mb-1">命名模板</label>
                        <input type="text" v-model="localPreset.namingTemplate"
                            class="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none placeholder-white/20"
                            placeholder="{name}_{index}">
                        <div class="mt-1 text-[10px] text-white/30">预览: {{ previewName }}</div>
                    </div>

                    <!-- Resize -->
                    <div class="p-3 bg-black/20 rounded-lg border border-white/5">
                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" v-model="localPreset.resizeEnabled" class="accent-blue-500">
                            <span class="text-sm">调整尺寸</span>
                        </label>

                        <div v-if="localPreset.resizeEnabled" class="grid grid-cols-[auto_1fr] gap-2 items-center pl-5">
                            <select v-model="localPreset.resizeMode"
                                class="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none">
                                <option value="longEdge">长边</option>
                                <option value="shortEdge">短边</option>
                                <option value="width">宽度</option>
                                <option value="height">高度</option>
                                <option value="percentage">百分比</option>
                            </select>
                            <div class="flex items-center gap-2">
                                <input type="number" v-model.number="localPreset.resizeValue"
                                    class="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none">
                                <span class="text-xs text-white/50">{{ localPreset.resizeMode === 'percentage' ? '%' :
                                    'px' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Watermark -->
                    <div class="p-3 bg-black/20 rounded-lg border border-white/5">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="localPreset.watermarkEnabled" class="accent-blue-500">
                            <span class="text-sm">添加水印</span>
                            <span v-if="localPreset.watermarkEnabled"
                                class="text-xs text-blue-400 ml-auto hover:underline"
                                @click.stop="$emit('configure-watermark')">配置...</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 shrink-0">
                <button class="px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                    @click="$emit('cancel')">取消</button>
                <button
                    class="px-6 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 transition-colors font-medium shadow-lg shadow-blue-500/20"
                    @click="handleExport">
                    开始导出
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 内置导出预设, 默认导出预设 } from '../../types/export.types'
import type { ExportPreset } from '../../types/export.types'

const props = defineProps<{
    selectedCount: number
}>()

const emit = defineEmits<{
    (e: 'cancel'): void
    (e: 'confirm', payload: { preset: ExportPreset, mode: 'individual' | 'zip' }): void
    (e: 'configure-watermark'): void
}>()

const mode = ref<'individual' | 'zip'>('individual')
const localPreset = ref<ExportPreset>({ ...默认导出预设 })

const selectPreset = (preset: ExportPreset) => {
    localPreset.value = { ...preset }
}

const previewName = computed(() => {
    const ext = localPreset.value.format === 'jpeg' ? 'jpg' : localPreset.value.format
    let name = localPreset.value.namingTemplate
        .replace('{name}', 'sample')
        .replace('{date}', new Date().toISOString().slice(0, 10))
        .replace('{index}', '1')
    return `${name}${localPreset.value.suffix}.${ext}`
})

const handleExport = () => {
    emit('confirm', {
        preset: { ...localPreset.value },
        mode: mode.value
    })
}
</script>
