import {
    ref, computed, JSZip, projectFS,
    processImageToTileable, blobToDataURL,
    默认导出预设, convertImage, downloadBlob, lutDb
} from './imports'
import type { ExportPreset, ExportTask, 水印配置, HSLAdjustmentLayer } from './imports'
import { useProjectState } from './project-state/index'

/**
 * 批量导出逻辑
 */
const queue = ref<ExportTask[]>([])
const isExporting = ref(false)
const isCancelled = ref(false)
const currentTask = ref<ExportTask | null>(null)
const preset = ref<ExportPreset>(默认导出预设)
const mode = ref<'individual' | 'zip'>('individual')

const progress = computed(() => ({
    current: queue.value.filter(t => t.status === 'done').length,
    total: queue.value.length,
    percentage: queue.value.length > 0
        ? Math.round(queue.value.filter(t => t.status === 'done').length / queue.value.length * 100)
        : 0
}))

const estimatedTimeRemaining = computed(() => {
    const doneTasks = queue.value.filter(t => t.status === 'done' && t.startTime && t.endTime)
    if (doneTasks.length === 0) return null

    const avgTime = doneTasks.reduce((sum, t) => sum + (t.endTime! - t.startTime!), 0) / doneTasks.length
    const pendingCount = queue.value.filter(t => t.status === 'pending' || t.status === 'processing').length
    return Math.round(avgTime * pendingCount / 1000) // 秒
})

// === Helpers ===

const generateFileName = (projectName: string): string => {
    const p = preset.value
    const ext = p.format === 'jpeg' ? 'jpg' : p.format

    let fileName = p.namingTemplate
        .replace('{name}', projectName)
        .replace('{date}', new Date().toISOString().slice(0, 10))
        .replace('{index}', String(queue.value.findIndex(t => t.projectName === projectName) + 1))

    return `${fileName}${p.suffix}.${ext}`
}

const processProject = async (projectId: string): Promise<Blob> => {
    const { state } = useProjectState()
    const project = state.projects.value.find(proj => proj.id === projectId)
    if (!project) throw new Error('项目不存在')

    // 加载原图
    const originalKey = project.originalPath.split('/')[1]
    const originalBlob = await projectFS.loadAsset(originalKey)
    if (!originalBlob) throw new Error('原图不存在')

    // 转换为 DataURL
    const originalDataUrl = await blobToDataURL(originalBlob)

    // === 构建 HSL 图层（合并 globalHSL）===
    const hslLayers = buildHSLLayersForExport(project.params)

    // === 加载 LUT 文件 ===
    let lutFile: File | undefined
    if (project.params.lutId) {
        const luts = await lutDb.getAllLUTs()
        const lutItem = luts.find(item => item.id === project.params.lutId)
        if (lutItem) {
            lutFile = new File([lutItem.file], lutItem.name, { type: 'text/plain' })
        }
    }

    // === 解析水印配置（项目优先/全局优先）===
    const watermarkConfig = resolveWatermarkForExport(project.params, preset.value)
    const enableWatermark = watermarkConfig !== undefined

    // 调用现有的处理管线
    const resultDataUrl = await processImageToTileable({
        originalImage: originalDataUrl,
        maxResolution: project.params.maxResolution,
        borderSize: project.params.borderSize,
        hslLayers,
        dehazeParams: project.params.dehazeParams,
        clarityParams: project.params.clarityParams,
        luminanceParams: project.params.luminanceParams,
        exposureStrength: project.params.exposureStrength,
        exposureManual: project.params.exposureManual,
        // LUT 参数
        lutFile,
        lutIntensity: project.params.lutIntensity ?? 1.0,
        // 水印参数
        watermarkConfig,
        enableWatermark
    })

    if (!resultDataUrl) {
        throw new Error('处理失败，生成图像为空')
    }

    // 转换为目标格式的 Blob
    return await convertImage(resultDataUrl, {
        format: preset.value.format,
        quality: preset.value.quality,
        resizeEnabled: preset.value.resizeEnabled,
        resizeMode: preset.value.resizeMode,
        resizeValue: preset.value.resizeValue
    })
}

/**
 * 构建导出用的 HSL 图层（合并 globalHSL 到图层数组）
 */
function buildHSLLayersForExport(params: { globalHSL: { hue: number; saturation: number; lightness: number }; hslLayers: HSLAdjustmentLayer[] }): HSLAdjustmentLayer[] {
    const { globalHSL, hslLayers } = params
    // 如果 globalHSL 有非零值，将其作为特殊图层添加到数组开头
    const hasGlobalAdjustment = globalHSL.hue !== 0 || globalHSL.saturation !== 0 || globalHSL.lightness !== 0
    if (!hasGlobalAdjustment) {
        return [...hslLayers]
    }

    const globalLayer: HSLAdjustmentLayer = {
        id: 'global',
        name: '全局调整',
        enabled: true,
        hue: globalHSL.hue,
        saturation: globalHSL.saturation,
        lightness: globalHSL.lightness,
        // 全局调整应用于所有颜色
        targetColor: null,
        colorRange: 180
    }
    return [globalLayer, ...hslLayers]
}

/**
 * 解析导出时的水印配置
 * 优先级：导出预设 > 项目配置
 */
function resolveWatermarkForExport(
    projectParams: { watermarkConfig: 水印配置 | null; enableWatermark: boolean },
    exportPreset: ExportPreset
): 水印配置 | undefined {
    // 如果导出预设启用了水印，使用导出预设的配置
    if (exportPreset.watermarkEnabled && exportPreset.watermarkConfig) {
        return exportPreset.watermarkConfig
    }
    // 否则，如果项目启用了水印，使用项目的配置
    if (projectParams.enableWatermark && projectParams.watermarkConfig) {
        return projectParams.watermarkConfig
    }
    return undefined
}

const processIndividual = async () => {
    for (const task of queue.value) {
        if (isCancelled.value) {
            task.status = 'cancelled'
            continue
        }

        // Skip non-pending tasks (for retry)
        if (task.status !== 'pending') continue

        currentTask.value = task
        task.status = 'processing'
        task.startTime = Date.now()

        try {
            const blob = await processProject(task.projectId)
            task.result = blob
            task.status = 'done'
            task.endTime = Date.now()

            // 立即触发下载
            const fileName = generateFileName(task.projectName)
            downloadBlob(blob, fileName)

        } catch (e) {
            console.error(e)
            // task.error = e as Error 
            // Avoid type assertion if possible, but Error is standard
            if (e instanceof Error) task.error = e
            else task.error = new Error(String(e))

            task.status = 'error'
            task.endTime = Date.now()
        }
    }
    currentTask.value = null
}

const processAndZip = async () => {
    const zip = new JSZip()
    // Note: If retrying, we might want to keep existing blobs? 
    // For simplicity, we re-process everything that is pending or error, 
    // but successful tasks might have 'result' blob already? 
    // Current logic doesn't store result blob permanently in memory for long queues to avoid OOM?
    // task.result is there.

    // For simple implementation: process everything, then zip.
    // If invalid/cancelled, skip.

    for (const task of queue.value) {
        if (isCancelled.value) {
            task.status = 'cancelled'
            continue
        }

        if (task.status === 'done' && task.result) {
            // Already done (e.g. from previous run?), just add to zip
            const fileName = generateFileName(task.projectName)
            zip.file(fileName, task.result)
            continue
        }

        if (task.status !== 'pending') continue

        currentTask.value = task
        task.status = 'processing'
        task.startTime = Date.now()

        try {
            const blob = await processProject(task.projectId)
            task.result = blob
            task.status = 'done'
            task.endTime = Date.now()

            // 添加到 ZIP
            const fileName = generateFileName(task.projectName)
            zip.file(fileName, blob)

        } catch (e) {
            console.error(e)
            if (e instanceof Error) task.error = e
            else task.error = new Error(String(e))

            task.status = 'error'
            task.endTime = Date.now()
        }
    }

    currentTask.value = null

    // 生成并下载 ZIP (Only if not cancelled and has some success)
    if (!isCancelled.value && queue.value.some(t => t.status === 'done')) {
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        })
        const date = new Date().toISOString().slice(0, 10)
        downloadBlob(zipBlob, `seamless_textures_${date}.zip`)
    }
}

// === Actions ===

const cancel = () => {
    isCancelled.value = true
}

const startExport = async (projectIds: string[], p: ExportPreset, m: 'individual' | 'zip') => {
    preset.value = p
    mode.value = m
    isCancelled.value = false

    const { state } = useProjectState()

    queue.value = projectIds.map(id => {
        const project = state.projects.value.find(proj => proj.id === id)
        return {
            projectId: id,
            projectName: project?.name ?? 'unknown',
            status: 'pending' as const
        }
    })

    isExporting.value = true

    if (m === 'individual') {
        await processIndividual()
    } else {
        await processAndZip()
    }

    isExporting.value = false
}

const retryFailed = async () => {
    // Reset failed tasks to pending
    queue.value.forEach(t => {
        if (t.status === 'error') {
            t.status = 'pending'
            t.error = undefined
        }
    })

    isExporting.value = true
    isCancelled.value = false

    if (mode.value === 'individual') {
        await processIndividual()
    } else {
        await processAndZip()
    }

    isExporting.value = false
}

export function useBatchExport() {
    return {
        queue,
        isExporting,
        isCancelled,
        currentTask,
        preset,
        mode,
        progress,
        estimatedTimeRemaining,
        startExport,
        cancel,
        retryFailed
    }
}
