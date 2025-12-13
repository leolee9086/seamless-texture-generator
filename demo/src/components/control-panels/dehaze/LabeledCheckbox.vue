<template>
    <div class="flex items-center justify-between">
        <label class="text-xs text-white/70">{{ label }}</label>
        <input type="checkbox" :checked="modelValue" @change="handleChange" :disabled="disabled"
            class="w-4 h-4 rounded border-white/20 bg-white/10 text-white/60 focus:ring-white/20">
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    label: string
    modelValue: boolean
    disabled?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

function handleChange(event: Event) {
    emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>
