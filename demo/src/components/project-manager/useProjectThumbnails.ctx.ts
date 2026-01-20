import { ref, watch, onUnmounted } from './imports'
import { projectFS } from './imports'
import type { ImageProject, Ref } from './imports'

/**
 * 项目缩略图管理上下文
 * 
 * 共享的缩略图加载与缓存逻辑
 */
export function useProjectThumbnails(projects: Ref<ImageProject[]>) {
    const thumbnails = ref<Record<string, string>>({})
    const imageLoaded = ref<Record<string, boolean>>({})

    const loadThumbnail = async (project: ImageProject) => {
        if (thumbnails.value[project.id]) return

        try {
            const key = project.thumbnailPath.replace('assets/', '')
            const blob = await projectFS.loadAsset(key)
            if (blob) {
                thumbnails.value[project.id] = URL.createObjectURL(blob)
            }
        } catch (error) {
            console.error('Failed to load thumbnail:', error)
        }
    }

    watch(() => projects.value, async (newProjects) => {
        for (const project of newProjects) {
            if (!thumbnails.value[project.id]) {
                // 不等待，并行加载
                loadThumbnail(project)
            }
        }

        // 清理旧缩略图
        const newIds = new Set(newProjects.map(project => project.id))
        for (const [id, url] of Object.entries(thumbnails.value)) {
            if (!newIds.has(id)) {
                URL.revokeObjectURL(url)
                delete thumbnails.value[id]
                delete imageLoaded.value[id]
            }
        }
    }, { deep: true, immediate: true })

    onUnmounted(() => {
        // 组件卸载时清理所有
        for (const url of Object.values(thumbnails.value)) {
            URL.revokeObjectURL(url)
        }
    })

    return {
        thumbnails,
        imageLoaded
    }
}
