/**
 * ModelScope 文生图 API 客户端
 */

import type {
  GenerationParams,
  TaskResponse,
  TaskStatusResponse,
  ApiError,
  PollTaskUntilCompleteParams,
  SubmitGenerationTaskParams,
  GetTaskStatusParams,
} from './types'
import { robustFetch, createAuthHeaders } from './fetchWrapper.api'
import {
  MODEL_SCOPE_BASE_URL,
  HEADER_ASYNC_MODE,
  HEADER_TASK_TYPE,
  TASK_TYPE_IMAGE_GENERATION,
  MODEL_Z_IMAGE_TURBO,
  DEFAULT_N,
  ENDPOINT_IMAGE_GENERATIONS,
  ENDPOINT_TASK_STATUS,
  ERROR_POLL_TIMEOUT,
} from './constants'
import {
  buildProxyUrl,
  IMAGE_GENERATION_URL,
  TASK_STATUS_URL,
} from './templates'

/**
 * 提交文生图任务
 */
export async function submitGenerationTask(
  params: SubmitGenerationTaskParams
): Promise<string[]> {
  const { apiKey, prompt, params: generationParams = {} ,proxyUrl} = params
      const proxiedUrl = proxyUrl?buildProxyUrl(MODEL_SCOPE_BASE_URL,proxyUrl):MODEL_SCOPE_BASE_URL

  const url = IMAGE_GENERATION_URL(proxiedUrl, ENDPOINT_IMAGE_GENERATIONS)

  // 获取任务数量，默认为 1
  const n = generationParams.n ?? DEFAULT_N
  
  // 构建基础有效负载（不包含 n，因为每个请求只生成一张图片）
  const basePayload: Omit<GenerationParams, 'n'> = {
    model: generationParams.model || MODEL_Z_IMAGE_TURBO,
    prompt,
    ...(generationParams.size && { size: generationParams.size }),
    ...(generationParams.seed !== undefined && { seed: generationParams.seed }),
    ...(generationParams.steps !== undefined && { steps: generationParams.steps }),
    ...(generationParams.guidance !== undefined && { guidance: generationParams.guidance }),
    ...(generationParams.negative_prompt && { negative_prompt: generationParams.negative_prompt }),
    ...(generationParams.image_url && { image_url: generationParams.image_url }),
    ...(generationParams.loras && { loras: generationParams.loras }),
  }

  // 如果 n 为 1，直接发起单个请求
  if (n === 1) {
    const response = await robustFetch<TaskResponse>(url, {
      method: 'POST',
      headers: {
        ...createAuthHeaders(apiKey),
        [HEADER_ASYNC_MODE]: 'true',
      },
      body: JSON.stringify(basePayload),
    })
    return [response.task_id]
  }

  // 并发发起 n 个请求
  const requests = Array.from({ length: n }, async () => {
    // 为每个请求生成不同的种子（如果未指定种子）
    const payload = {
      ...basePayload,
      ...(basePayload.seed === undefined && { seed: Math.floor(Math.random() * 2147483647) }),
    }
    const response = await robustFetch<TaskResponse>(url, {
      method: 'POST',
      headers: {
        ...createAuthHeaders(apiKey),
        [HEADER_ASYNC_MODE]: 'true',
      },
      body: JSON.stringify(payload),
    })
    return response.task_id
  })

  return Promise.all(requests)
}

/**
 * 获取任务状态
 */
export async function getTaskStatus(
  params: GetTaskStatusParams
): Promise<TaskStatusResponse> {
  const { apiKey, taskId, proxyUrl } = params
  
  const url = TASK_STATUS_URL(    MODEL_SCOPE_BASE_URL, ENDPOINT_TASK_STATUS, taskId)
  const proxiedUrl = proxyUrl?buildProxyUrl(url,proxyUrl):url
  const response = await robustFetch<TaskStatusResponse>(proxiedUrl, {
    headers: {
      ...createAuthHeaders(apiKey),
      [HEADER_TASK_TYPE]: TASK_TYPE_IMAGE_GENERATION,
    },
  })
  return response
}

/**
 * 轮询任务直到完成或失败
 */
export async function pollTaskUntilComplete(
  params: PollTaskUntilCompleteParams
): Promise<TaskStatusResponse> {
  const { apiKey, taskId, interval = 2000, maxAttempts = 60, proxyUrl } = params
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getTaskStatus({ apiKey, taskId, proxyUrl })
    if (status.task_status === 'SUCCEED' || status.task_status === 'FAILED') {
      return status
    }
    // 等待 interval 毫秒
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error(ERROR_POLL_TIMEOUT(taskId))
}

/**
 * 从成功响应中提取图片 URL
 */
export function extractImageUrl(status: TaskStatusResponse): string | undefined {
  return status.output_images?.[0]
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message,
    }
  }
  return {
    code: 'UNKNOWN',
    message: '未知错误',
  }
}