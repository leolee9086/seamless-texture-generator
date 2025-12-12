/**
 * SecureApiKeyInput 组件逻辑
 */

import { ref, computed, onMounted, type Ref, type ComputedRef } from './imports'
import { secureKeyManager } from './SecureKeyManager.class'

// Re-export secureKeyManager for other modules
export { secureKeyManager }
import type {
  InputMode,
  UseSecureApiKeyInputParams,
  UseSecureApiKeyInputReturn,
  NotifyKeyStatusParams
} from './SecureApiKeyInput.types'
import { INPUT_MODE, API_KEY_PREFIX, EMPTY_STRING, ERROR_MESSAGES } from './SecureApiKeyInput.constants'

/**
 * 创建安全密钥输入组件的逻辑
 */
/**
 * 创建安全密钥输入组件的状态
 */
function createSecureApiKeyState(): {
  inputMode: Ref<InputMode>
  fileName: Ref<string>
  tempApiKey: Ref<string>
} {
  const inputMode = ref<InputMode>(INPUT_MODE.FILE)
  const fileName = ref(EMPTY_STRING)
  const tempApiKey = ref(EMPTY_STRING)

  return {
    inputMode,
    fileName,
    tempApiKey
  }
}

/**
 * 创建安全密钥输入组件的计算属性
 */
function createSecureApiKeyComputed(state: ReturnType<typeof createSecureApiKeyState>): {
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  hasAnyKey: ComputedRef<boolean>
} {
  const { tempApiKey } = state

  const hasKeyFile = computed(() => secureKeyManager.hasKeyFile())
  const hasTempKey = computed(() => tempApiKey.value.trim().startsWith(API_KEY_PREFIX))
  const hasAnyKey = computed(() => hasKeyFile.value || hasTempKey.value)

  return {
    hasKeyFile,
    hasTempKey,
    hasAnyKey
  }
}

/**
 * 通知密钥状态变化
 */
function notifyKeyStatus(params: NotifyKeyStatusParams): void {
  const { mode, hasKeyFile, hasTempKey, onKeyReady } = params

  if (mode === INPUT_MODE.TEMP) {
    onKeyReady?.(hasTempKey.value)
    return
  }

  if (mode === INPUT_MODE.FILE) {
    onKeyReady?.(hasKeyFile.value)
  }
}

/**
 * 创建安全密钥输入组件的方法
 */
function createSecureApiKeyMethods(
  state: ReturnType<typeof createSecureApiKeyState>,
  computed: ReturnType<typeof createSecureApiKeyComputed>,
  params: UseSecureApiKeyInputParams
): {
  selectKeyFile: () => Promise<void>
  clearKeyFile: () => void
  setInputMode: (mode: InputMode) => void
  handleTempKeyChange: () => void
} {
  const { fileName, inputMode } = state
  const { hasKeyFile, hasTempKey } = computed
  const { onKeyReady, onKeyCleared } = params

  const selectKeyFile = async (): Promise<void> => {
    try {
      const success = await secureKeyManager.selectKeyFile()
      if (success) {
        fileName.value = await secureKeyManager.getFileName()
        onKeyReady?.(true)
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.FILE_SELECTION_FAILED, error)
    }
  }

  const clearKeyFile = (): void => {
    secureKeyManager.clearSession()
    fileName.value = EMPTY_STRING
    onKeyCleared?.()
  }

  const setInputMode = (mode: InputMode): void => {
    // 清理不再活跃的模式的状态
    if (mode === INPUT_MODE.FILE) {
      // 切换到文件模式，清除临时密钥
      state.tempApiKey.value = EMPTY_STRING
    }
    inputMode.value = mode
    notifyKeyStatus({ mode, hasKeyFile, hasTempKey, onKeyReady })
  }

  const handleTempKeyChange = (): void => {
    if (inputMode.value === INPUT_MODE.TEMP) {
      onKeyReady?.(hasTempKey.value)
    }
  }

  return {
    selectKeyFile,
    clearKeyFile,
    setInputMode,
    handleTempKeyChange
  }
}

/**
 * 初始化组件挂载时的密钥状态
 */
function initializeKeyStatus(
  fileName: Ref<string>,
  onKeyReady?: (hasKey: boolean) => void
): void {
  onMounted(async () => {
    if (secureKeyManager.hasKeyFile()) {
      fileName.value = await secureKeyManager.getFileName()
      onKeyReady?.(true)
    }
  })
}

/**
 * 创建安全密钥输入组件的逻辑
 */
export function useSecureApiKeyInput(params: UseSecureApiKeyInputParams): UseSecureApiKeyInputReturn {
  const state = createSecureApiKeyState()
  const computed = createSecureApiKeyComputed(state)
  const methods = createSecureApiKeyMethods(state, computed, params)

  // 初始化组件挂载时的密钥状态
  initializeKeyStatus(state.fileName, params.onKeyReady)

  return {
    state: {
      ...state,
      ...computed
    },
    actions: methods
  }
}