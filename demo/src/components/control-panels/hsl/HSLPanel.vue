<template>
    <div class="flex flex-col gap-4">
        <div v-if="!originalImage" :class="emptyStateClass">
            <div class="i-carbon-color-palette text-1xl"></div>
            <span class="text-sm">Please select an image first</span>
        </div>

        <div v-else :class="contentContainerClass">
            <!-- Global HSL Adjustment -->
            <div class="pb-3 pt-3" :class="{ 'px-4': !isMobile }">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-white/80">
                        全局HSL调整
                    </label>
                    <button @click="resetGlobalHSL"
                        class="glass-btn text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
                        :disabled="!hasGlobalAdjustments">
                        <div class="i-carbon-reset"></div>
                        <span>重置</span>
                    </button>
                </div>

                <Slider :items="globalSliderItems" @updateValue="handleGlobalSliderUpdate" />
            </div>

            <!-- Color-Specific HSL Layers -->
            <HSLLayersPanel
                :isMobile="isMobile"
                :hslLayers="hslLayers"
                @controlEvent="handleControlEvent" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Slider } from '@leolee9086/slider-component'
import HSLLayersPanel from './HSLLayersPanel.vue'
import type { HSLAdjustmentLayer } from '../../../adjustments/hsl/hslAdjustStep'
import { createUpdateDataEvent } from '../../../types/controlEvents'
import type { ControlEvent } from '../../../types/controlEvents'
import { getGlobalSliderItems } from './params'
const props = defineProps<{
    isMobile?: boolean
    originalImage: string | null
    globalHSL?: { hue: number; saturation: number; lightness: number }
    hslLayers?: HSLAdjustmentLayer[]
}>()

const emit = defineEmits<{
    'controlEvent': [event: ControlEvent]
}>()

// State - 使用props中的状态，如果没有则使用默认值
const globalHSL = ref({
    hue: props.globalHSL?.hue || 0,
    saturation: props.globalHSL?.saturation || 0,
    lightness: props.globalHSL?.lightness || 0
})

const hslLayers = ref<HSLAdjustmentLayer[]>(props.hslLayers || [])

// 监听props变化，同步本地状态
watch(() => props.globalHSL, (newGlobalHSL) => {
    if (newGlobalHSL) {
        globalHSL.value = {
            hue: newGlobalHSL.hue,
            saturation: newGlobalHSL.saturation,
            lightness: newGlobalHSL.lightness
        }
    }
}, { deep: true })

watch(() => props.hslLayers, (newHslLayers) => {
    if (newHslLayers) {
        hslLayers.value = [...newHslLayers]
    }
}, { deep: true })


// Computed
const emptyStateClass = computed(() =>
    props.isMobile
        ? 'text-center text-white/30 py-8 text-sm'
        : 'flex flex-col items-center justify-center py-12 text-white/30 gap-4'
)

const contentContainerClass = computed(() =>
    props.isMobile
        ? 'flex flex-col gap-3'
        : 'flex flex-col gap-3 bg-white/5 rounded-2xl border border-white/5'
)

const hasGlobalAdjustments = computed(() =>
    globalHSL.value.hue !== 0 || globalHSL.value.saturation !== 0 || globalHSL.value.lightness !== 0
)

const globalSliderItems = computed(getGlobalSliderItems(
    {
        globalHSL
    }
))

// Methods
const handleGlobalSliderUpdate = (data: { id: string; value: number | string }) => {
    // 强制转换为number,防止字符串导致NaN
    const numericValue = typeof data.value === 'string' ? parseFloat(data.value) : data.value
    if (isNaN(numericValue)) {
        console.error(`[HSLPanel] Invalid value for ${data.id}: ${data.value}`)
        return
    }

    if (data.id === 'global-hue') globalHSL.value.hue = numericValue
    else if (data.id === 'global-saturation') globalHSL.value.saturation = numericValue
    else if (data.id === 'global-lightness') globalHSL.value.lightness = numericValue

    // 创建全局HSL调整层
    const globalLayer: HSLAdjustmentLayer = {
        id: 'global-hsl-layer',
        type: 'global',
        hue: globalHSL.value.hue,
        saturation: globalHSL.value.saturation,
        lightness: globalHSL.value.lightness
    }

    emit('controlEvent', createUpdateDataEvent('global-hsl-change', globalLayer))
}

const resetGlobalHSL = () => {
    globalHSL.value = { hue: 0, saturation: 0, lightness: 0 }

    // 创建重置后的全局HSL调整层
    const globalLayer: HSLAdjustmentLayer = {
        id: 'global-hsl-layer',
        type: 'global',
        hue: 0,
        saturation: 0,
        lightness: 0
    }

    emit('controlEvent', createUpdateDataEvent('global-hsl-change', globalLayer))
}

// 处理来自 HSLLayersPanel 的事件
const handleControlEvent = (event: ControlEvent) => {
    const { action, data } = event.detail
    
    switch (action) {
        case 'add-hsl-layer':
            hslLayers.value.push(data as HSLAdjustmentLayer)
            break
        case 'remove-hsl-layer':
            hslLayers.value = hslLayers.value.filter(l => l.id !== data)
            break
        case 'update-hsl-layer':
            const { id, data: updateData } = data as { id: string; data: { id: string; value: number | string } }
            const layer = hslLayers.value.find(l => l.id === id)
            if (!layer) {
                console.error(`[HSLPanel] Layer not found: ${id}`)
                return
            }

            // 强制转换为number,防止字符串导致NaN
            let numericValue: number
            if (typeof updateData.value === 'string') {
                numericValue = parseFloat(updateData.value)
            } else if (typeof updateData.value === 'number') {
                numericValue = updateData.value
            } else {
                console.error(`[HSLPanel] Invalid value type for ${updateData.id}: ${typeof updateData.value}`)
                return
            }

            // 检查是否为有效数字
            if (isNaN(numericValue) || !isFinite(numericValue)) {
                console.error(`[HSLPanel] Invalid value for ${updateData.id}: ${updateData.value}`)
                return
            }

            // 根据字段类型设置适当的默认值和范围
            const updates: Partial<HSLAdjustmentLayer> = {}
            
            if (updateData.id === 'hue') {
                updates.hue = Math.max(-180, Math.min(180, numericValue))
            } else if (updateData.id === 'saturation') {
                updates.saturation = Math.max(-100, Math.min(100, numericValue))
            } else if (updateData.id === 'lightness') {
                updates.lightness = Math.max(-100, Math.min(100, numericValue))
            } else if (updateData.id === 'precision') {
                updates.precision = Math.max(0, Math.min(100, numericValue))
            } else if (updateData.id === 'range') {
                updates.range = Math.max(0, Math.min(100, numericValue))
            } else {
                console.error(`[HSLPanel] Unknown field: ${updateData.id}`)
                return
            }

            Object.assign(layer, updates)
            break
    }
    
    // 转发事件到父组件
    emit('controlEvent', event)
}
</script>

<style scoped>
/* Tailwind classes handled in template */
</style>

