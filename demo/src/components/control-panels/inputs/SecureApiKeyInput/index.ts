/**
 * SecureApiKeyInput 模块导出
 */

// 导出常量
export {
  INPUT_MODE,
  API_KEY_PREFIX,
  EMPTY_STRING,
  ERROR_MESSAGES,
  EVENT_NAMES,
  SUCCESS_MESSAGES,
  FILE_PICKER_OPTIONS,
  PERMISSION_MODE,
  PERMISSION_STATE,
  ERROR_NAMES,
  MEMORY_OVERWRITE_CHAR
} from './SecureApiKeyInput.constants'

// 导出类型
export type { 
  SecureApiKeyInputEmits, 
  SecureApiKeyInputProps, 
  SecureApiKeyInputReturn, 
  InputMode, 
  UseSecureApiKeyInputParams, 
  UseSecureApiKeyInputReturn 
} from './SecureApiKeyInput.types'

// 导出逻辑
export { useSecureApiKeyInput } from './SecureApiKeyInput.logic'

// 导出守卫
export {  isValidInputMode } from './SecureApiKeyInput.guard'

// 导出工具
export { formatApiKeyDisplay, validateApiKeyFormat } from './SecureApiKeyInput.utils'