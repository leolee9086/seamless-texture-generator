/**
 * SecureApiKeyInput 组件逻辑
 */

import { ref, computed, onMounted } from './imports'
import { secureKeyManager } from './SecureApiKeyInput.ctx'
import type { SecureApiKeyInputEmits, SecureApiKeyInputReturn } from './SecureApiKeyInput.types'
import type { Ref, ComputedRef } from './imports'
import { INPUT_MODE, API_KEY_PREFIX, EMPTY_STRING, ERROR_MESSAGES, EVENT_NAMES } from './SecureApiKeyInput.constants'

/**
 * 创建状态和计算属性
 */
function createSecureApiKeyInputState(): {
  inputMode: Ref<'file' | 'temp'>
  fileName: Ref<string>
  tempApiKey: Ref<string>
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  hasAnyKey: ComputedRef<boolean>
} {
  const inputMode = ref<'file' | 'temp'>(INPUT_MODE.FILE)
  const fileName = ref(EMPTY_STRING)
  const tempApiKey = ref(EMPTY_STRING)
  
  const hasKeyFile = computed(() => secureKeyManager.hasKeyFile())
  const hasTempKey = computed(() => tempApiKey.value.trim().startsWith(API_KEY_PREFIX))
  const hasAnyKey = computed(() => hasKeyFile.value || hasTempKey.value)
  
  return {
    inputMode,
    fileName,
    tempApiKey,
    hasKeyFile,
    hasTempKey,
    hasAnyKey
  }
}

/**
 * 创建密钥文件操作方法
 */
function createKeyFileMethods(
  fileName: Ref<string>,
  emit: SecureApiKeyInputEmits
): {
  selectKeyFile: () => Promise<void>
  clearKeyFile: () => void
} {
  const selectKeyFile = async (): Promise<void> => {
    try {
      const success = await secureKeyManager.selectKeyFile()
      if (success) {
        fileName.value = await secureKeyManager.getFileName()
        emit(EVENT_NAMES.KEY_READY, true)
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.FILE_SELECTION_FAILED, error)
    }
  }
  
  const clearKeyFile = (): void => {
    secureKeyManager.clearSession()
    fileName.value = EMPTY_STRING
    emit(EVENT_NAMES.KEY_CLEARED)
  }
  
  return { selectKeyFile, clearKeyFile }
}

/**
 * 创建输入模式处理方法
 */
function createInputModeMethods(params: {
  inputMode: Ref<'file' | 'temp'>
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  emit: SecureApiKeyInputEmits
}): {
  setInputMode: (mode: 'file' | 'temp') => void
  handleTempKeyChange: () => void
} {
  const { inputMode, hasKeyFile, hasTempKey, emit } = params
  const setInputMode = (mode: 'file' | 'temp'): void => {
    inputMode.value = mode
    
    if (mode === INPUT_MODE.TEMP) {
      emit(EVENT_NAMES.KEY_READY, hasTempKey.value)
    }
    
    if (mode === INPUT_MODE.FILE) {
      emit(EVENT_NAMES.KEY_READY, hasKeyFile.value)
    }
  }
  
  const handleTempKeyChange = (): void => {
    if (inputMode.value === INPUT_MODE.TEMP) {
      emit(EVENT_NAMES.KEY_READY, hasTempKey.value)
    }
  }
  
  return { setInputMode, handleTempKeyChange }
}

/**
 * 初始化组件
 */
function initializeComponent(
  fileName: Ref<string>,
  emit: SecureApiKeyInputEmits
): void {
  onMounted(async () => {
    if (secureKeyManager.hasKeyFile()) {
      fileName.value = await secureKeyManager.getFileName()
      emit(EVENT_NAMES.KEY_READY, true)
    }
  })
}

export function useSecureApiKeyInput(props: { isMobile?: boolean }, emit: SecureApiKeyInputEmits): SecureApiKeyInputReturn {
  const state = createSecureApiKeyInputState()
  const keyFileMethods = createKeyFileMethods(state.fileName, emit)
  const inputModeMethods = createInputModeMethods({
    inputMode: state.inputMode,
    hasKeyFile: state.hasKeyFile,
    hasTempKey: state.hasTempKey,
    emit
  })
  
  initializeComponent(state.fileName, emit)
  
  return {
    ...state,
    ...keyFileMethods,
    ...inputModeMethods
  }
}