<template>
    <div 
        class="fixed bottom-0 left-0 right-0 z-30 bg-[#1e1e1e]/95 backdrop-blur-md border-t border-white/10 transition-transform duration-300 ease-out"
        :class="expanded ? 'translate-y-0' : 'translate-y-[calc(100%-24px)]'"
        :style="{ height: '160px' }"
    >
        <!-- Drag Handle / Header -->
        <div 
            class="h-6 w-full flex items-center justify-center cursor-pointer bg-white/5 active:bg-white/10"
            @click="toggleExpanded"
        >
            <div class="w-12 h-1 rounded-full bg-white/20"></div>
        </div>

        <!-- Content -->
        <div class="h-[calc(160px-24px)] overflow-x-auto flex items-center gap-3 px-4 py-2">
            <!-- Add Button -->
            <label class="shrink-0 w-24 h-24 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 bg-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
                <span class="text-2xl mb-1">+</span>
                <span class="text-xs">导入</span>
                <input type="file" class="hidden" accept="image/*" multiple @change="handleFileChange" />
            </label>

            <!-- Project List -->
            <div 
                v-for="project in projects" 
                :key="project.id"
                class="shrink-0 w-24 h-24 relative rounded-lg overflow-hidden border transition-all active:scale-95"
                :class="activeProjectId === project.id ? 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'border-white/10'"
                @click="switchProject(project.id)"
            >
                <img 
                    v-if="thumbnails[project.id]" 
                    :src="thumbnails[project.id]" 
                    class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full bg-black/50 flex items-center justify-center text-white/20">
                    ...
                </div>
                
                <!-- Active Indicator -->
                <div v-if="activeProjectId === project.id" class="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-[10px] text-white text-center py-0.5">
                    当前
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from './imports'
import { useProjectState } from './imports'
import { useProjectThumbnails } from './useProjectThumbnails.ctx'

const expanded = ref(false)

const { state, actions } = useProjectState()
const { projects, activeProjectId } = state
const { createProjects, switchProject } = actions

const { thumbnails } = useProjectThumbnails(projects)

const toggleExpanded = () => {
    expanded.value = !expanded.value
}

const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
        const newProjects = await createProjects(Array.from(input.files))
        if (newProjects.length > 0) {
            await switchProject(newProjects[0].id)
            if (!expanded.value) expanded.value = true
        }
        input.value = ''
    }
}
</script>
