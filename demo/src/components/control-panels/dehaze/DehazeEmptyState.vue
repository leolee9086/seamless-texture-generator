<template>
    <div :class="emptyStateClass(isMobile)">
        <div class="i-carbon-fog text-1xl"></div>
        <span class="text-sm">Please select an image first</span>
    </div>
</template>

<script setup lang="ts">
import { emptyStateClass } from './dehazePanel.utils'

defineProps<{
    isMobile?: boolean
}>()
</script>
