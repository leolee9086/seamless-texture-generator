<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
                <!-- 遮罩层 -->
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleCancel"></div>

                <!-- 弹窗内容 -->
                <div
                    class="relative bg-gray-900/95 border border-orange-500/50 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <!-- 标题栏 -->
                    <div class="px-5 py-4 bg-orange-900/30 border-b border-orange-500/30">
                        <h3 class="text-lg font-semibold text-orange-300">{{ PROXY_WARNING.TITLE }}</h3>
                    </div>

                    <!-- 内容区 -->
                    <div class="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
                        <!-- 说明 -->
                        <p class="text-sm text-white/80 leading-relaxed">{{ PROXY_WARNING.DESCRIPTION }}</p>

                        <!-- 代理要求 -->
                        <div class="bg-white/5 rounded-lg p-3">
                            <h4 class="text-sm font-medium text-orange-300 mb-2">{{ PROXY_WARNING.REQUIREMENTS_TITLE }}
                            </h4>
                            <ul class="space-y-1.5">
                                <li v-for="(req, idx) in PROXY_WARNING.REQUIREMENTS" :key="idx"
                                    class="text-xs text-white/60 flex items-start gap-2">
                                    <span class="text-orange-400 shrink-0">•</span>
                                    <span>{{ req }}</span>
                                </li>
                            </ul>
                        </div>

                        <!-- 解决方案 -->
                        <div class="bg-blue-900/20 rounded-lg p-3">
                            <h4 class="text-sm font-medium text-blue-300 mb-2">{{ PROXY_WARNING.SOLUTIONS_TITLE }}</h4>
                            <ul class="space-y-1.5">
                                <li v-for="(sol, idx) in PROXY_WARNING.SOLUTIONS" :key="idx"
                                    class="text-xs text-white/60 flex items-start gap-2">
                                    <span class="text-blue-400 shrink-0">{{ idx + 1 }}.</span>
                                    <span>{{ sol }}</span>
                                </li>
                            </ul>
                        </div>

                        <!-- 继续警告 -->
                        <p class="text-xs text-orange-400/70 italic">{{ PROXY_WARNING.CONTINUE_WARNING }}</p>
                    </div>

                    <!-- 按钮区 -->
                    <div class="px-5 py-4 bg-white/5 border-t border-white/10 flex justify-end gap-3">
                        <button @click="handleCancel"
                            class="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                            {{ PROXY_WARNING.BUTTONS.CANCEL }}
                        </button>
                        <button @click="handleContinue"
                            class="px-4 py-2 text-sm font-medium text-white bg-orange-600/80 hover:bg-orange-500/80 rounded-lg transition-colors">
                            {{ PROXY_WARNING.BUTTONS.CONTINUE }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { PROXY_WARNING } from './ProxyWarningModal.constants'

defineProps<{
    show: boolean
}>()

const emit = defineEmits<{
    'continue': []
    'cancel': []
}>()

function handleContinue(): void {
    emit('continue')
}

function handleCancel(): void {
    emit('cancel')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
    transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
    transform: scale(0.95);
}
</style>
