<template>
    <div 
        class="layer-item bg-white/5 border border-white/5 rounded transition-all hover:bg-white/10 overflow-hidden"
        :class="{ 'border-blue-500/50': isActive }"
    >
        <!-- Layer Summary (Click to Toggle Expand) -->
        <div class="layer-header p-2 flex items-center gap-2 cursor-pointer bg-white/5" @click="$emit('toggle-expand')">
            <div class="w-8 h-8 rounded bg-black/40 overflow-hidden border border-white/10 flex-shrink-0">
                    <img v-if="layer.imageSource" :src="layer.imageSource" class="w-full h-full object-cover" />
            </div>
            
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ layer.name }}</div>
                <div class="text-[10px] text-white/50 flex gap-2">
                    <span>{{ layer.blendMode }}</span>
                    <span>{{ Math.round(layer.opacity * 100) }}%</span>
                    <span>{{ layer.maskRules.length }} Rules</span>
                </div>
            </div>

            <div class="flex items-center gap-1">
                    <button 
                    @click.stop="$emit('toggle-visibility', layer)"
                    :class="layer.visible ? 'text-white/80' : 'text-white/30'"
                    class="hover:text-white transition-colors p-1"
                >
                    <i :class="layer.visible ? 'i-carbon-view' : 'i-carbon-view-off'" />
                </button>
                    <button 
                    @click.stop="$emit('delete', layer.id)"
                    class="text-red-400 hover:text-red-300 transition-colors p-1"
                >
                    <i class="i-carbon-trash-can" />
                </button>
            </div>
        </div>

        <!-- Detailed Controls (Expanded) -->
        <div v-show="isActive" class="layer-details p-2 border-t border-white/5 bg-black/20">
            
            <!-- Layer Global Settings -->
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label class="text-[10px] text-white/50 block mb-1">Blend Mode</label>
                    <select 
                        v-model="layer.blendMode" 
                        class="w-full bg-black/40 border border-white/10 rounded text-xs px-2 py-1 text-white/70 outline-none focus:border-blue-500"
                        @change="$emit('update')"
                    >
                        <option value="normal">Normal</option>
                        <option value="add">Add</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="max">Max</option>
                        <option value="min">Min</option>
                    </select>
                </div>
                    <div>
                    <label class="text-[10px] text-white/50 block mb-1">Opacity</label>
                    <input type="range" v-model.number="layer.opacity" :min="0" :max="1" :step="0.01" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" @input="$emit('update')" />
                </div>
            </div>

            <!-- Suggested Colors Palette -->
            <div v-if="(layer.layerPalette && layer.layerPalette.length > 0) || (basePalette && basePalette.length > 0)" class="mb-3">
                <label class="text-[10px] text-white/50 block mb-1">Suggested Colors</label>
                
                <!-- Layer Colors -->
                <div v-if="layer.layerPalette && layer.layerPalette.length > 0" class="flex gap-1 flex-wrap mb-2">
                    <div class="text-[9px] text-white/30 w-full mb-0.5">Self</div>
                    <button 
                        v-for="(color, cIdx) in layer.layerPalette" 
                        :key="`l-${cIdx}`"
                        class="w-6 h-6 rounded-full border border-white/20 hover:border-white transition-all transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        :style="{ backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }"
                        :title="`Self - H:${Math.round(color.h)} S:${Math.round(color.s)} L:${Math.round(color.l)}`"
                        @click.stop="$emit('add-rule-from-color', layer.id, color)"
                    >
                    </button>
                </div>

                <!-- Base Colors -->
                <div v-if="basePalette && basePalette.length > 0" class="flex gap-1 flex-wrap">
                    <div class="text-[9px] text-white/30 w-full mb-0.5">Base</div>
                    <button 
                        v-for="(color, cIdx) in basePalette" 
                        :key="`b-${cIdx}`"
                        class="w-6 h-6 rounded-full border border-white/20 hover:border-white transition-all transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        :style="{ backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }"
                        :title="`Base - H:${Math.round(color.h)} S:${Math.round(color.s)} L:${Math.round(color.l)}`"
                        @click.stop="$emit('add-rule-from-color', layer.id, color)"
                    >
                    </button>
                </div>
            </div>

            <!-- Mask Rules List -->
            <div class="mask-rules">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold text-white/50 uppercase">Mask Rules ({{ layer.maskRules.length }})</span>
                    <button @click.stop="$emit('add-rule', layer.id)" class="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <i class="i-carbon-add" /> Add Rule
                    </button>
                </div>

                <div v-if="layer.maskRules.length === 0" class="text-center py-2 text-[10px] text-white/30 border border-dashed border-white/5 rounded">
                    No rules (Fully Visible)
                </div>

                <div class="space-y-2">
                    <div v-for="(rule, rIdx) in layer.maskRules" :key="rule.id" class="rule-item bg-white/5 rounded p-2 text-xs relative group">
                        <button @click.stop="$emit('remove-rule', layer.id, rule.id)" class="absolute top-1 right-1 text-white/20 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i class="i-carbon-close" />
                        </button>
                        
                        <!-- Visual Swatch -->
                        <div class="absolute top-1 right-6 w-3 h-3 rounded-full border border-white/20"
                                :style="{ backgroundColor: `hsl(${rule.hue}, ${rule.saturation}%, ${rule.lightness}%)` }"
                        ></div>
                        
                        <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                                <!-- Hue -->
                            <div>
                                <div class="flex justify-between text-[10px] text-white/40"><span>Hue</span><span>{{ Math.round(rule.hue) }}</span></div>
                                <input type="range" v-model.number="rule.hue" :min="0" :max="360" class="w-full h-1 bg-white/5 rounded accent-blue-500/80" @input="$emit('update')" />
                            </div>
                            <div>
                                <div class="flex justify-between text-[10px] text-white/40"><span>H-Tol</span><span>{{ Math.round(rule.hueTolerance) }}</span></div>
                                <input type="range" v-model.number="rule.hueTolerance" :min="1" :max="180" class="w-full h-1 bg-white/5 rounded accent-blue-500/80" @input="$emit('update')" />
                            </div>

                            <!-- Sat -->
                            <div>
                                <div class="flex justify-between text-[10px] text-white/40"><span>Sat</span><span>{{ Math.round(rule.saturation) }}</span></div>
                                <input type="range" v-model.number="rule.saturation" :min="0" :max="100" class="w-full h-1 bg-white/5 rounded accent-blue-500/80" @input="$emit('update')" />
                            </div>
                            <div>
                                <div class="flex justify-between text-[10px] text-white/40"><span>S-Tol</span><span>{{ Math.round(rule.saturationTolerance) }}</span></div>
                                <input type="range" v-model.number="rule.saturationTolerance" :min="1" :max="100" class="w-full h-1 bg-white/5 rounded accent-blue-500/80" @input="$emit('update')" />
                            </div>

                            <!-- Light -->
                            <div>
                                <div class="flex justify-between text-[10px] text-white/40"><span>Lum</span><span>{{ Math.round(rule.lightness) }}</span></div>
                                <input type="range" v-model.number="rule.lightness" :min="0" :max="100" class="w-full h-1 bg-white/5 rounded accent-blue-500/80" @input="$emit('update')" />
                            </div>
                                <div>
                                <div class="flex justify-between text-[10px] text-white/40"><span>L-Tol</span><span>{{ Math.round(rule.lightnessTolerance) }}</span></div>
                                <input type="range" v-model.number="rule.lightnessTolerance" :min="1" :max="100" class="w-full h-1 bg-white/5 rounded accent-blue-500/80" @input="$emit('update')" />
                            </div>

                            <!-- Feather/Invert -->
                            <div class="col-span-2 flex items-center justify-between pt-1 border-t border-white/5 mt-1">
                                <div class="flex-1 mr-2">
                                    <div class="flex justify-between text-[10px] text-white/40"><span>Feather</span><span>{{ rule.feather.toFixed(2) }}</span></div>
                                    <input type="range" v-model.number="rule.feather" :min="0" :max="1" :step="0.01" class="w-full h-1 bg-white/5 rounded accent-green-500/80" @input="$emit('update')" />
                                </div>
                                <label class="flex items-center text-[10px] text-white/60 cursor-pointer">
                                    <input type="checkbox" v-model="rule.invert" class="mr-1 rounded bg-white/10" @change="$emit('update')" /> Inv
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { CompositorLayer, HSLRule } from '../../../proceduralTexturing/other/AdvancedGrayscaleCompositor/types'

defineProps<{
    layer: CompositorLayer;
    isActive: boolean;
    basePalette?: {h: number, s: number, l: number}[];
}>();

defineEmits<{
    (e: 'update'): void;
    (e: 'toggle-expand'): void;
    (e: 'toggle-visibility', layer: CompositorLayer): void;
    (e: 'delete', id: string): void;
    (e: 'add-rule', layerId: string): void;
    (e: 'remove-rule', layerId: string, ruleId: string): void;
    (e: 'add-rule-from-color', layerId: string, color: any): void;
}>();
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor; /* Use text color via class */
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
</style>
