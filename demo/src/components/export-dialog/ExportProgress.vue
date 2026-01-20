<template>
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div
            class="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-[480px] p-6 flex flex-col font-sans text-white/90">

            <h2 class="text-lg font-medium mb-1">
                <span v-if="exporter.isCancelled.value">已取消</span>
                <span v-else-if="progress.percentage === 100">导出完成</span>
                <span v-else>正在导出...</span>
            </h2>
            <div class="text-xs text-white/50 mb-6 flex justify-between">
                <span>{{ statusText }}</span>
                <span v-if="exporter.estimatedTimeRemaining.value !== null && progress.percentage < 100">
                    剩余约 {{ exporter.estimatedTimeRemaining.value }} 秒
                </span>
            </div>

            <!-- Progress Bar -->
            <div class="h-2 bg-white/10 rounded-full overflow-hidden mb-6 relative">
                <div class="absolute inset-0 bg-blue-500 transition-all duration-300 ease-out"
                    :style="{ width: `${progress.percentage}%` }">
                </div>
                <!-- Striped animation -->
                <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripes_1s_linear_infinite]"
                    v-if="progress.percentage < 100 && !exporter.isCancelled.value">
                </div>
            </div>

            <!-- Task List (Latest 5 or so) -->
            <div class="flex-1 max-h-[200px] overflow-y-auto space-y-2 mb-6 text-sm">
                <!-- Current Processing -->
                <div v-if="exporter.currentTask.value"
                    class="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/5 animate-pulse">
                    <div class="w-4 h-4 flex items-center justify-center">
                        <span
                            class="animate-spin block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                    </div>
                    <span class="truncate flex-1">{{ exporter.currentTask.value.projectName }}</span>
                    <span class="text-xs text-white/50">处理中...</span>
                </div>

                <!-- Finished Items (Show last few) -->
                <div v-for="task in reversedDoneTasks" :key="task.projectId"
                    class="flex items-center gap-3 p-2 rounded opacity-80"
                    :class="task.status === 'error' ? 'text-red-400' : 'text-green-400'">
                    <div class="w-4 h-4 flex items-center justify-center">
                        <span v-if="task.status === 'done'">✅</span>
                        <span v-else>❌</span>
                    </div>
                    <span class="truncate flex-1 text-white/80">{{ task.projectName }}</span>
                    <span v-if="task.status === 'done'" class="text-xs text-white/30 hidden">已完成</span>
                    <span v-else class="text-xs opacity-70">{{ task.error?.message }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
                <!-- Close / Finish -->
                <button v-if="progress.percentage === 100 || exporter.isCancelled.value"
                    class="px-6 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 transition-colors"
                    @click="$emit('close')">
                    关闭
                </button>

                <!-- Cancel -->
                <button v-if="progress.percentage < 100 && !exporter.isCancelled.value"
                    class="px-4 py-2 rounded-lg text-sm hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors"
                    @click="exporter.cancel()">
                    取消
                </button>

                <!-- Retry -->
                <button v-if="hasErrors && progress.percentage === 100"
                    class="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg"
                    @click="handleRetry">
                    重试失败项
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBatchExport } from '../../composables/useBatchExport'

const emit = defineEmits<{
    (e: 'close'): void
}>()

const exporter = useBatchExport()
const progress = exporter.progress

const statusText = computed(() => {
    if (exporter.isCancelled.value) return '操作已取消'
    if (progress.value.percentage === 100) {
        const errors = exporter.queue.value.filter(t => t.status === 'error').length
        if (errors > 0) return `完成，但有 ${errors} 个失败`
        return '全部导出成功'
    }
    return `正在处理: ${progress.value.current} / ${progress.value.total}`
})

const reversedDoneTasks = computed(() => {
    return exporter.queue.value
        .filter(t => t.status === 'done' || t.status === 'error')
        .slice().reverse().slice(0, 5) // Show last 5
})

const hasErrors = computed(() => exporter.queue.value.some(t => t.status === 'error'))

const handleRetry = async () => {
    await exporter.retryFailed()
}
</script>

<style scoped>
@keyframes progress-stripes {
    from {
        background-position: 20px 0;
    }

    to {
        background-position: 0 0;
    }
}
</style>
