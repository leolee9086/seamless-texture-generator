<template>
    <div class="flex flex-col gap-4">
        <div :class="panelClass">
            <p :class="textClass">
                贴图无缝化算法来源
            </p>
            <a href="https://unity-grenoble.github.io/website/demo/2020/10/16/demo-histogram-preserving-blend-make-tileable.html" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/30 overflow-hidden']">
                <div class="i-carbon-link text-blue-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-blue-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">算法来源</span>
            </a>
            
            <p :class="textClass">
                全景图查看器
            </p>
            <a href="https://leolee9086.github.io/cc-panoviewer/" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/30 overflow-hidden']">
                <div class="i-carbon-view text-purple-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-purple-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">全景图查看器</span>
            </a>
            
            <p :class="textClass">
                支持我们
            </p>
            <a href="https://afdian.net/a/leolee9086" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 hover:border-orange-500/30 overflow-hidden']">
                <div class="i-carbon-cafe text-orange-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-orange-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">爱发电支持</span>
            </a>
            
            <p :class="textClass">
                反馈问题
            </p>
            <a href="https://qm.qq.com/cgi-bin/qm/qr?k=1qXJ8mK8wK8mK8wK8mK8wK8" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/30 overflow-hidden']">
                <div class="i-carbon-chat text-green-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-green-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">QQ群: 1017854502</span>
            </a>
            
            <p :class="textClass">
                推荐工具
            </p>
            <a href="https://b3log.org/siyuan/" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 hover:border-indigo-500/30 overflow-hidden']">
                <div class="i-carbon-notebook text-indigo-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-indigo-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">思源笔记</span>
            </a>
            
            <p :class="textClass">
                更多链接
            </p>
            <a href="https://github.com/leolee9086/cc-panoviewer" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20 hover:border-gray-500/30 overflow-hidden']">
                <div class="i-carbon-code text-gray-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-gray-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">全景图GitHub</span>
            </a>
            
            <a href="https://www.zhihu.com/people/wen-zhi-dao-56" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/20 hover:border-blue-600/30 overflow-hidden']">
                <div class="i-carbon-logo-zhihu text-blue-500 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-blue-200']" class="overflow-hidden text-ellipsis whitespace-nowrap">知乎主页</span>
            </a>
            
            <a href="https://www.xiaohongshu.com/discovery/item/688064050000000017033b0f?source=webshare&xhsshare=pc_web&xsec_token=ABwffSm9tG8q7n3DsTW7VqWGAk6LToL0vxg5r6xQpncLw=&xsec_source=pc_share" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/30 overflow-hidden']">
                <div class="i-carbon-logo-xiaohongshu text-red-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-red-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">小红书主页</span>
            </a>
            
            <a href="https://space.bilibili.com/71034467?spm_id_from=333.1007.0.0" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-pink-600/10 hover:bg-pink-600/20 border-pink-600/20 hover:border-pink-600/30 overflow-hidden']">
                <div class="i-carbon-logo-bilibili text-pink-500 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-pink-200']" class="overflow-hidden text-ellipsis whitespace-nowrap">B站主页</span>
            </a>
            
            <a href="https://qm.qq.com/q/oq68sOKWQg" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20 hover:border-teal-500/30 overflow-hidden']">
                <div class="i-carbon-group-chat text-teal-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-teal-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">思源爱好者群</span>
            </a>
            
            <div class="border-t border-white/10 my-4"></div>
            
            <p :class="textClass">
                If you like this project, consider supporting its development.
            </p>
            <a href="https://github.com/leolee9086/seamless-texture-generator" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 overflow-hidden']">
                <div class="i-carbon-logo-github text-white group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="labelClass" class="overflow-hidden text-ellipsis whitespace-nowrap">GitHub
                    Repository</span>
            </a>
            <a href="https://github.com/sponsors/leolee9086" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20 hover:border-pink-500/30 overflow-hidden']">
                <div class="i-carbon-favorite text-pink-400 group-hover:scale-110 transition-transform" :class="iconClass">
                </div>
                <span :class="[labelClass, 'text-pink-100']" class="overflow-hidden text-ellipsis whitespace-nowrap">{{
                    isMobile ? 'Sponsor' : `Sponsor on
                    GitHub` }}</span>
            </a>
            <a v-if="!isMobile" href="mailto:leolee9086@example.com" target="_blank" rel="noopener noreferrer"
                :class="[buttonClass, 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/30 overflow-hidden']">
                <div class="i-carbon-email text-emerald-400 group-hover:scale-110 transition-transform"
                    :class="iconClass"></div>
                <span :class="[labelClass, 'text-emerald-100']"
                    class="overflow-hidden text-ellipsis whitespace-nowrap">Contact via Email</span>
            </a>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    isMobile?: boolean
}>()

const panelClass = computed(() =>
    props.isMobile
        ? ' rounded-2xl p-5 border border-white/5 flex flex-col gap-4'
        : ' rounded-2xl p-6 border border-white/5 flex flex-col gap-4'
)

const textClass = computed(() =>
    props.isMobile
        ? 'text-gray-300 text-sm leading-relaxed'
        : 'text-gray-300 leading-relaxed'
)

const buttonClass = computed(() =>
    props.isMobile
        ? 'glass-btn  flex-center gap-3 py-3 rounded-xl transition-all group min-w-0'
        : 'glass-btn flex-center gap-3 py-4 transition-all group min-w-0'
)

const iconClass = computed(() =>
    props.isMobile ? 'text-xl flex-shrink-0' : 'text-2xl flex-shrink-0'
)

const labelClass = computed(() =>
    props.isMobile ? 'text-sm font-medium truncate' : 'font-medium truncate'
)
</script>
