/**
 * SecureApiKeyInput 模块导出
 */

// 导入常量
import {
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

// 导入类型
import type {
  SecureApiKeyInputEmits,
  SecureApiKeyInputProps,
  SecureApiKeyInputState,
  SecureApiKeyInputActions,
  InputMode,
  UseSecureApiKeyInputParams,
  UseSecureApiKeyInputReturn
} from './SecureApiKeyInput.types'

// 导入逻辑
import { useSecureApiKeyInput } from './SecureApiKeyInput.logic'

// 导入守卫
import { isValidInputMode } from './SecureApiKeyInput.guard'

// 导入工具
import { formatApiKeyDisplay, validateApiKeyFormat } from './SecureApiKeyInput.utils'

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
}

// 导出类型
export type {
  SecureApiKeyInputEmits,
  SecureApiKeyInputProps,
  SecureApiKeyInputState,
  SecureApiKeyInputActions,
  InputMode,
  UseSecureApiKeyInputParams,
  UseSecureApiKeyInputReturn
}

// 导出逻辑
export { useSecureApiKeyInput }

// 导出守卫
export { isValidInputMode }

// 导出工具
export { formatApiKeyDisplay, validateApiKeyFormat }