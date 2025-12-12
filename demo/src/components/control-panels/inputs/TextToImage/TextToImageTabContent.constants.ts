/**
 * 文本生成图像相关常量定义
 */

// 验证错误消息
export const VALIDATION_ERRORS = {
  INVALID_API_KEY: 'API 密钥无效',
  EMPTY_PROMPT: '提示不能为空',
} as const

// 状态消息
export const STATUS_MESSAGES = {
  SUBMITTING: '提交任务中...',
  GENERATING: '正在生成...',
  DOWNLOADING: '生成成功，正在下载图像...',
  LOADED: '图像已加载到画布',
} as const

// 错误消息
export const ERROR_MESSAGES = {
  GENERATION_FAILED: '生成失败',
  TEXT_TO_IMAGE_ERROR: 'Text-to-Image error:',
  NO_IMAGE_URL: '未找到图像 URL',
  ALL_TASKS_FAILED: '所有任务均失败',
  TASK_SUCCEEDED_NO_IMAGE: '任务成功但未找到图像 URL',
  TASK_FAILED: '任务失败',
  UNKNOWN_ERROR: '未知错误',
} as const

// 默认值
export const DEFAULTS = {
  EMPTY_STRING: '',
  SIZE: '1024x1024',
  N: 1,
  NUM_INFERENCE_STEPS: 9,
  MODEL: 'Tongyi-MAI/Z-Image-Turbo',
  SHOW_ADVANCED: false,
  PROXY_URL: '/api/common-proxy',
} as const

// 可用模型列表
export const AVAILABLE_MODELS = {
  'Tongyi-MAI/Z-Image-Turbo': 'Z-Image-Turbo (推荐)',
  'Tongyi-MAI/Z-Image': 'Z-Image',
  'Qwen/Qwen-Image': 'Qwen-Image',
} as const

// API 验证前缀
export const API_KEY_PREFIX = 'ms-'

// 任务状态
export const TASK_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCEED: 'SUCCEED',
  FAILED: 'FAILED',
} as const

// 错误消息模板
export const ERROR_TEMPLATES = {
  TASK_SUCCEEDED_NO_IMAGE: (taskId: string) => `任务 ${taskId} 成功但未找到图像 URL`,
  TASK_FAILED: (taskId: string, message: string) => `任务 ${taskId} 失败: ${message}`,
} as const

// 图片缓存相关常量
export const IMAGE_CACHE = {
  PREFIX: 'cached-image-',
  URL_PREFIX: 'cached-image-url:',
  URL_LIST_KEY: 'cached-image-url-list',
  MAX_COUNT: 10,
  ERROR_MESSAGES: {
    CACHE_FAILED: 'Failed to cache image:',
    FAILED_TO_DECODE_PROXY_URL: 'Failed to decode proxy URL:',
  }
} as const

// IndexedDB 相关常量
export const INDEXED_DB = {
  DB_NAME: 'ImageCacheDB',
  DB_VERSION: 1,
  STORE_NAME: 'imageCache',
  URL_LIST_STORE_NAME: 'urlList',
  URL_LIST_ID: 'main',
  KEY_PATH: {
    URL: 'url',
    ID: 'id',
  },
  TRANSACTION_MODE: {
    READONLY: 'readonly',
    READWRITE: 'readwrite',
  },
  ERROR_MESSAGES: {
    FAILED_TO_OPEN: 'Failed to open IndexedDB',
    FAILED_TO_GET_IMAGES: 'Failed to get cached images:',
    FAILED_TO_GET_IMAGE: 'Failed to get cached image by URL:',
    FAILED_TO_GET_URL_LIST: 'Failed to get URL list:',
    FAILED_TO_CLEAR_CACHE: 'Failed to clear all cache:',
  }
} as const