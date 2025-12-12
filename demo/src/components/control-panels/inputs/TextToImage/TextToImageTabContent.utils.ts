/**
 * 文本生成图像工具函数
 */

import { submitGenerationTask, pollTaskUntilComplete, computed, fetchImageAsBase64, buildProxyUrl, type Ref, type ComputedRef, type TaskStatusResponse } from './imports'
import type { TextToImageParams, TextToImageResult, ProcessTaskResultParams } from './TextToImageTabContent.types'
import { ERROR_MESSAGES, ERROR_TEMPLATES, TASK_STATUS } from './TextToImageTabContent.constants'

/**
 * 处理单个任务结果
 */
function processTaskResult(params: ProcessTaskResultParams): void {
  const { result, taskId, imageUrls, errors } = params
  
  if (result.task_status !== TASK_STATUS.SUCCEED) {
    errors.push(ERROR_TEMPLATES.TASK_FAILED(taskId, result.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR))
    return
  }

  const imageUrl = result.output_images?.[0]
  imageUrl && imageUrls.push(imageUrl) || errors.push(ERROR_TEMPLATES.TASK_SUCCEEDED_NO_IMAGE(taskId))
}

/**
 * 提交任务并获取任务 ID
 */
async function submitTasks(params: TextToImageParams): Promise<string[]> {
  return await submitGenerationTask({
    apiKey: params.apiKey,
    prompt: params.prompt,
    params: {
      size: params.size,
      n: params.n,
      steps: params.numInferenceSteps,
      model: params.model
    },
    proxyUrl: params.proxyUrl
  })
}

/**
 * 轮询所有任务
 */
async function pollAllTasks(
  params: TextToImageParams,
  taskIds: string[]
): Promise<TaskStatusResponse[]> {
  const pollPromises = taskIds.map(taskId =>
    pollTaskUntilComplete({
      apiKey: params.apiKey,
      taskId,
      interval: 2000,
      maxAttempts: 60,
      proxyUrl: params.proxyUrl
    })
  )
  return await Promise.all(pollPromises)
}

/**
 * 处理任务结果并收集图像 URL
 */
function collectImageUrls(
  results: TaskStatusResponse[],
  taskIds: string[]
): { imageUrls: string[]; errors: string[] } {
  const imageUrls: string[] = []
  const errors: string[] = []

  for (const [index, result] of results.entries()) {
    processTaskResult({
      result,
      taskId: taskIds[index],
      imageUrls,
      errors
    })
  }

  return { imageUrls, errors }
}

/**
 * 生成图像
 */
export async function generateTextToImage(
  params: TextToImageParams
): Promise<TextToImageResult> {
  try {
    const taskIds = await submitTasks(params)
    const results = await pollAllTasks(params, taskIds)
    const { imageUrls, errors } = collectImageUrls(results, taskIds)

    if (imageUrls.length === 0) {
      return {
        success: false,
        error: errors.join('; ') || ERROR_MESSAGES.ALL_TASKS_FAILED
      }
    }

    return {
      success: true,
      imageUrls
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED
    return {
      success: false,
      error: message
    }
  }
}

/**
 * 处理图像点击事件
 */
export async function handleImageClick(
  imageUrl: string,
  proxyUrl: Ref<string>,
  onImageSet: (base64: string) => void
): Promise<void> {
  try {
    const proxiedUrl = buildProxyUrl(imageUrl, proxyUrl.value)
    const base64 = await fetchImageAsBase64(proxiedUrl)
    onImageSet(base64)
  } catch (error) {
    console.error('Failed to load image:', error)
  }
}

/**
 * 创建代理URL计算函数
 */
export function createProxiedUrlsComputed(
  generatedImages: Ref<string[]>,
  proxyUrl: Ref<string>
): ComputedRef<string[]> {
  return computed(() => (
    generatedImages.value.map(
      (item: string) => {
        const proxiedUrl = proxyUrl.value ? buildProxyUrl(item, proxyUrl.value) : item
        return proxiedUrl
      }
    )
  ))
}