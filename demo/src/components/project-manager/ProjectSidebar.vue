<template>
    <div class="project-sidebar flex flex-col bg-black/60 backdrop-blur-xl border-l border-white/10">
        <!-- Header -->
        <div class="header h-12 flex items-center px-4 border-b border-white/10 shrink-0">
            <h2 class="text-sm font-medium text-white/90 flex items-center gap-2">
                <span>📁</span>
                <span>项目列表</span>
                <span class="text-xs text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full ml-1">
                    {{ projectCount }}
                </span>
            </h2>
        </div>

        <!-- Project List -->
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <div v-for="project in projects" :key="project.id"
                class="project-item group relative rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden p-2 flex gap-3 select-none"
                :class="[
                    activeProjectId === project.id
                        ? 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                ]" @click="handleProjectClick(project.id)" @contextmenu="handleContextMenu($event, project.id)">
                <!-- Thumbnail -->
                <div class="relative w-16 h-16 shrink-0 rounded bg-black/50 overflow-hidden border border-white/10">
                    <img v-if="thumbnails[project.id]" :src="thumbnails[project.id]"
                        class="w-full h-full object-cover transition-opacity duration-300"
                        :class="imageLoaded[project.id] ? 'opacity-100' : 'opacity-0'"
                        @load="imageLoaded[project.id] = true" alt="thumbnail" />
                    <div v-else class="w-full h-full flex items-center justify-center text-white/20">
                        <span class="animate-pulse">...</span>
                    </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 class="text-xs font-medium text-white/90 truncate mb-1" :title="project.name">
                        {{ project.name }}
                    </h3>
                    <div class="text-[10px] text-white/50 flex flex-col gap-0.5">
                        <span>{{ formatTime(project.updatedAt) }}</span>
                        <!-- Status indicators could go here -->
                    </div>
                </div>

                <!-- Active Indicator -->
                <div v-if="activeProjectId === project.id"
                    class="absolute right-2 top-2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                </div>

                <!-- Delete Button (Hover) -->
                <button
                    class="absolute right-2 bottom-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                    @click.stop="handleDelete(project.id)" title="删除项目">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <!-- Empty State -->
            <div v-if="projects.length === 0"
                class="flex flex-col items-center justify-center py-10 text-white/30 text-xs">
                <span class="text-2xl mb-2">🖼️</span>
                <p>暂无项目</p>
                <p class="mt-1">点击上方加载图片</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer p-3 border-t border-white/10 shrink-0 grid grid-cols-2 gap-2">
            <button
                class="glass-btn flex items-center justify-center gap-2 px-3 py-2 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!hasProjects" @click="emit('export')">
                <span>📦</span>
                <span>导出全部</span>
            </button>
            <button
                class="glass-btn flex items-center justify-center gap-2 px-3 py-2 rounded text-xs hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!hasProjects" @click="handleClearAll">
                <span>🗑️</span>
                <span>清空</span>
            </button>
        </div>


        <!-- Context Menu -->
        <div v-if="contextMenu.visible"
            class="fixed z-50 bg-black/90 border border-white/10 rounded-lg shadow-2xl py-1 min-w-[180px] backdrop-blur-md"
            :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }" @click.stop>
            <div class="px-3 py-2 text-xs text-white/40 border-b border-white/5 mb-1">
                批量操作
            </div>

            <button
                class="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2 transition-colors"
                @click="batchAction('all')">
                <span>🌍</span>
                <span>应用到所有项目</span>
            </button>

            <button
                class="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2 transition-colors"
                @click="batchAction('above')">
                <span>⬆️</span>
                <span>应用到上方项目</span>
            </button>

            <button
                class="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-blue-500/20 hover:text-blue-300 flex items-center gap-2 transition-colors"
                @click="batchAction('below')">
                <span>⬇️</span>
                <span>应用到下方项目</span>
            </button>

            <div class="h-px bg-white/10 my-1"></div>

            <button
                class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                @click="handleDeleteFromMenu">
                <span>🗑️</span>
                <span>删除项目</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useProjectState } from './imports'
import { useProjectThumbnails } from './useProjectThumbnails.ctx'

const emit = defineEmits<{
    (e: 'export'): void
}>()

const { state, actions } = useProjectState()
const { projects, activeProjectId, projectCount, hasProjects } = state
const {
    switchProject,
    deleteProject,
    clearAllProjects,
    applyParamsToAll,
    applyParamsToAbove,
    applyParamsToBelow
} = actions

// Use shared thumbnail logic
const { thumbnails, imageLoaded } = useProjectThumbnails(projects)

const handleProjectClick = async (id: string) => {
    if (activeProjectId.value === id) return
    await switchProject(id)
}

const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return
    await deleteProject(id)
}

const handleClearAll = async () => {
    if (!confirm('确定要清空所有项目吗？这将无法恢复！')) return
    await clearAllProjects()
}

/** @简洁函数 格式化时间 */
const formatTime = (ms: number) => {
    const date = new Date(ms)
    // Simple logic: if today, show HH:MM, otherwise show MM-DD
    const now = new Date()
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()

    if (isToday) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    if (isToday) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// === Context Menu ===
const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    projectId: null as string | null
})

const handleContextMenu = (e: MouseEvent, projectId: string) => {
    e.preventDefault()
    contextMenu.value = {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        projectId
    }
}

const closeContextMenu = () => {
    contextMenu.value.visible = false
}

const batchAction = async (type: 'all' | 'above' | 'below') => {
    const id = contextMenu.value.projectId
    if (!id) return

    closeContextMenu()

    // Could add loading state or toast here
    if (type === 'all') await applyParamsToAll(id)
    if (type === 'above') await applyParamsToAbove(id)
    if (type === 'below') await applyParamsToBelow(id)
}

const handleDeleteFromMenu = async () => {
    const id = contextMenu.value.projectId
    if (!id) return
    closeContextMenu()
    await handleDelete(id)
}

// Build-in global click listener to close menu
const onGlobalClick = () => {
    if (contextMenu.value.visible) closeContextMenu()
}

onMounted(() => window.addEventListener('click', onGlobalClick))
onUnmounted(() => window.removeEventListener('click', onGlobalClick))
</script>

<style scoped>
/* Custom scrollbar for sidebar specific if needed, though global style handles it */
.project-sidebar ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
}
</style>
