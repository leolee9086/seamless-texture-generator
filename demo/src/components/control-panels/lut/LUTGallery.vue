<template>
    <div :class="[
        isMobile ? 'flex gap-2 overflow-x-auto p-1 custom-scrollbar' : 'grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar'
    ]">
        <!-- Add Button -->
        <div class="aspect-square bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group"
            :class="[isMobile ? 'w-24 h-24' : '']" @click="$emit('trigger-upload')">
            <div class="i-carbon-add text-2xl text-white/50 group-hover:text-white/80 transition-colors"></div>
            <span class="text-xs text-white/40 mt-1 group-hover:text-white/70">Add LUT</span>
        </div>

        <!-- LUT Items -->
        <div v-for="lut in luts" :key="lut.id"
            class="relative aspect-square rounded-lg overflow-hidden cursor-pointer border transition-all group" :class="[
                selectedId === lut.id
                    ? 'border-primary-500 ring-1 ring-primary-500'
                    : 'border-white/10 hover:border-white/30',
                isMobile ? 'w-24 h-24' : ''
            ]" @click="$emit('select', lut)">
            <!-- Thumbnail -->
            <img v-if="lut.thumbnail && !imageError[lut.id]" :src="lut.thumbnail" class="w-full h-full object-cover"
                alt="LUT Thumbnail" @error="handleImageError(lut.id)" />
            <div v-else class="w-full h-full bg-gray-800 flex items-center justify-center">
                <span class="text-xs text-white/30 text-center px-1 break-all">{{ lut.name }}</span>
            </div>

            <!-- Name Overlay (on hover) -->
            <div
                class="absolute inset-x-0 bottom-0 bg-black/60 p-1 transform translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-between gap-1">
                <p class="text-[10px] text-white truncate flex-1 text-center">{{ lut.name }}</p>

                <!-- Update Thumbnail Button -->
                <button class="glass-btn p-1 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                    title="Update Thumbnail" @click.stop="$emit('update-thumbnail', lut.id)">
                    <div class="i-carbon-image-copy text-[10px]"></div>
                </button>
            </div>

            <!-- Delete Button -->
            <button
                class="glass-btn absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                @click.stop="$emit('delete', lut.id)">
                <div class="i-carbon-trash-can text-white text-xs"></div>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LUTItem } from '../../../utils/lutDb'
import { isMobileDevice } from '../../../utils/common-utils/deviceDetection'

defineProps<{
    luts: LUTItem[]
    selectedId: string | null
}>()

defineEmits<{
    'trigger-upload': []
    'select': [lut: LUTItem]
    'delete': [id: string]
    'update-thumbnail': [id: string]
}>()

const imageError = ref<Record<string, boolean>>({})

// 检测是否为移动设备
const isMobile = computed(() => isMobileDevice())

const handleImageError = (id: string) => {
    imageError.value[id] = true
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 移动端样式 */
.flex {
    display: flex;
    flex-wrap: nowrap;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
    /* iOS 平滑滚动 */
    padding-bottom: 8px;
    /* 为滚动条留出空间 */
}

/* 确保移动端项目不会缩小 */
.flex>* {
    flex: 0 0 auto;
    min-width: 0;
}

/* 移动端滚动条样式 */
.flex::-webkit-scrollbar {
    height: 4px;
}

.flex::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
}

.flex::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.flex::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}
</style>
