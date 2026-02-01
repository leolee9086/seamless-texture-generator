<template>
    <div class="mt-2 pt-2 border-t border-white/10">
        <div class="flex gap-2 items-center">
            <input v-model="presetName" type="text" placeholder="预设名称"
                class="flex-1 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-xs" />
            <button @click="handleSave"
                class="px-3 py-1.5 rounded-md bg-green-500/20 border border-green-500/30 text-green-500 text-xs cursor-pointer">
                保存
            </button>
        </div>
        <div v-if="presets.length" class="mt-2 flex flex-col gap-1">
            <div v-for="preset in presets" :key="preset.id"
                class="flex justify-between items-center px-2.5 py-1.5 rounded-md bg-white/3">
                <span @click="$emit('apply', preset)" class="cursor-pointer text-gray-400 text-xs hover:text-white">
                    {{ preset.名称 }}
                </span>
                <button @click="$emit('delete', preset.id)"
                    class="bg-transparent border-none text-gray-500 cursor-pointer text-base hover:text-red-500">
                    ×
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { 水印预设 } from './watermark.types'

defineProps<{
    presets: 水印预设[]
}>()

const emit = defineEmits<{
    save: [name: string]
    apply: [preset: 水印预设]
    delete: [id: string]
}>()

const presetName = ref('')

function handleSave() {
    if (!presetName.value.trim()) return
    emit('save', presetName.value.trim())
    presetName.value = ''
}
</script>
