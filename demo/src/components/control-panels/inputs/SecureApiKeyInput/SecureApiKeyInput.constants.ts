/**
 * SecureApiKeyInput 和 SecureKeyManager 相关常量定义
 */

// 输入模式
export const INPUT_MODE = {
  FILE: 'file',
  TEMP: 'temp'
} as const

// API 密钥前缀
export const API_KEY_PREFIX = 'ms-'

// 显示后缀
export const DISPLAY_SUFFIX = '...'

// 空字符串
export const EMPTY_STRING = ''

// 空密钥字符串（用于文件模式）
export const EMPTY_API_KEY = ''

// 事件名称
export const EVENT_NAMES = {
  KEY_READY: 'key-ready',
  KEY_CLEARED: 'key-cleared',
  UPDATE_MODEL_VALUE: 'update:modelValue'
} as const

// 错误消息
export const ERROR_MESSAGES = {
  FILE_SELECTION_FAILED: '选择密钥文件失败',
  INVALID_REF: 'Invalid ref type',
  FILE_SYSTEM_API_NOT_SUPPORTED: 'File System Access API 不受当前浏览器支持',
  FILE_HANDLE_ACQUISITION_FAILED: '获取文件句柄失败',
  USER_CANCELLED_FILE_SELECTION: '用户取消了文件选择',
  PERMISSION_VERIFICATION_FAILED: '权限验证失败',
  NO_KEY_FILE_SELECTED: '请先选择密钥文件',
  FILE_READ_PERMISSION_DENIED: '文件读取权限被拒绝',
  EMPTY_KEY_FILE: '密钥文件为空',
  GET_FILE_NAME_FAILED: '获取文件名失败',
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  FILE_HANDLE_ACQUIRED: '✅ 文件句柄已获取 (内容未读取)',
  KEY_EXECUTION_STARTED: '🚀 使用密钥执行请求...',
  KEY_MEMORY_CLEARED: '🔒 密钥已从内存痕迹中抹除',
  KEY_HANDLE_CLEARED: '🔒 密钥文件句柄已清除',
} as const

// 文件类型配置
export const FILE_PICKER_OPTIONS = {
  types: [
    {
      description: 'API Key File',
      accept: { 'text/plain': ['.txt', '.key', '.pem'] },
    },
  ],
  multiple: false,
}

// 权限模式
export const PERMISSION_MODE = {
  READ: 'read',
  READWRITE: 'readwrite',
} as const

// 权限状态
export const PERMISSION_STATE = {
  GRANTED: 'granted',
} as const

// 错误名称
export const ERROR_NAMES = {
  ABORT_ERROR: 'AbortError',
} as const

// 内存覆盖字符
export const MEMORY_OVERWRITE_CHAR = '*'

// 文件扩展名前缀
export const FILE_EXTENSION_PREFIX = '.'

// API Key 显示长度
export const API_KEY_DISPLAY_LENGTH = 6

// API Key 显示模板
export const API_KEY_DISPLAY_TEMPLATE = (prefix: string, suffix: string): string => `${prefix}${suffix}`