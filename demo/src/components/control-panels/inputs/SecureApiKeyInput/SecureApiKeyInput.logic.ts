/**
 * SecureApiKeyInput 组件逻辑
 */

import { ref, computed, onMounted, watch } from './imports'
import { secureKeyManager } from './SecureApiKeyInput.ctx'
import type { SecureApiKeyInputEmits, SecureApiKeyInputState, SecureApiKeyInputActions } from './SecureApiKeyInput.types'
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
  tempApiKey: Ref<string>
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  emit: SecureApiKeyInputEmits
}): {
  setInputMode: (mode: 'file' | 'temp') => void
  handleTempKeyChange: () => void
} {
  const { inputMode, tempApiKey, hasKeyFile, hasTempKey, emit } = params
  const setInputMode = (mode: 'file' | 'temp'): void => {
    // 清理不再活跃的模式的状态
    if (mode === INPUT_MODE.FILE) {
      // 切换到文件模式，清除临时密钥
      tempApiKey.value = EMPTY_STRING
    }
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

/**
 * 处理临时API Key更新
 */
function createTempApiKeyUpdater(
  tempApiKey: Ref<string>,
  handleTempKeyChange: () => void
): (value: string) => void {
  return (value: string) => {
    tempApiKey.value = value
    handleTempKeyChange()
  }
}

/**
 * 设置双向绑定的 watch
 */
function setupModelValueSync(
  tempApiKey: Ref<string>,
  props: { modelValue?: string },
  emit: SecureApiKeyInputEmits
): void {
  // 监听 tempApiKey 变化，同步到 modelValue
  watch(tempApiKey, (newValue: string) => {
    emit(EVENT_NAMES.UPDATE_MODEL_VALUE, newValue)
  })

  // 监听 modelValue 变化，同步到 tempApiKey
  watch(() => props.modelValue, (newValue: string | undefined) => {
    if (newValue !== undefined && newValue !== tempApiKey.value) {
      tempApiKey.value = newValue
    }
  }, { immediate: true })
}

export function useSecureApiKeyInput(props: { modelValue?: string; isMobile?: boolean }, emit: SecureApiKeyInputEmits): { state: SecureApiKeyInputState, actions: SecureApiKeyInputActions & { handleTempApiKeyUpdate: (value: string) => void } } {
  const state = createSecureApiKeyInputState()
  const keyFileMethods = createKeyFileMethods(state.fileName, emit)
  const inputModeMethods = createInputModeMethods({
    inputMode: state.inputMode,
    tempApiKey: state.tempApiKey,
    hasKeyFile: state.hasKeyFile,
    hasTempKey: state.hasTempKey,
    emit
  })

  // 设置双向绑定
  setupModelValueSync(state.tempApiKey, props, emit)

  initializeComponent(state.fileName, emit)

  // 创建临时 API Key 更新处理器
  const handleTempApiKeyUpdate = createTempApiKeyUpdater(
    state.tempApiKey,
    inputModeMethods.handleTempKeyChange
  )

  return {
    state,
    actions: {
      ...keyFileMethods,
      ...inputModeMethods,
      handleTempApiKeyUpdate
    }
  }
}