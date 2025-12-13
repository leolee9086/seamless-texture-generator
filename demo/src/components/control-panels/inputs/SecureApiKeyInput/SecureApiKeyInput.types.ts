/**
 * SecureApiKeyInput 组件和 SecureKeyManager 相关类型定义
 */

import type { Ref, ComputedRef } from './imports'


export type KeyRequestFunction<T> = (apiKey: string) => Promise<T>

// SecureApiKeyInput 组件类型
export interface SecureApiKeyInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'key-ready', hasKey: boolean): void
  (e: 'key-cleared'): void
}

export interface SecureApiKeyInputProps {
  modelValue?: string
  isMobile?: boolean
}

export interface SecureApiKeyInputState {
  // 状态
  inputMode: Ref<'file' | 'temp'>
  fileName: Ref<string>
  tempApiKey: Ref<string>
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
  hasAnyKey: ComputedRef<boolean>
}

export interface SecureApiKeyInputActions {
  // 方法
  selectKeyFile: () => Promise<void>
  clearKeyFile: () => void
  setInputMode: (mode: 'file' | 'temp') => void
  handleTempKeyChange: () => void
}



export type InputMode = 'file' | 'temp'

/**
 * useSecureApiKeyInput 参数 - 行为部分
 */
export interface UseSecureApiKeyInputParamsActions {
  onKeyReady?: (hasKey: boolean) => void
  onKeyCleared?: () => void
}

/**
 * useSecureApiKeyInput 参数 - 包装器 (符合 ECS 原则)
 * 注：isMobile 直接内联，避免单属性接口冗余
 */
export interface UseSecureApiKeyInputParams {
  isMobile?: boolean
  actions?: UseSecureApiKeyInputParamsActions
}

export interface UseSecureApiKeyInputReturn {
  state: SecureApiKeyInputState
  actions: SecureApiKeyInputActions
}

/**
 * 密钥状态通知参数 - 数据部分
 */
export interface NotifyKeyStatusParamsState {
  mode: InputMode
  hasKeyFile: ComputedRef<boolean>
  hasTempKey: ComputedRef<boolean>
}

/**
 * 密钥状态通知参数 - 包装器 (符合 ECS 原则)
 * 行为部分复用 UseSecureApiKeyInputParamsActions，避免单属性类型冗余
 */
export interface NotifyKeyStatusParams {
  state: NotifyKeyStatusParamsState
  actions: UseSecureApiKeyInputParamsActions
}

// File System Access API 类型定义
export interface FilePickerAcceptType {
  description?: string
  accept: Record<`${string}/${string}`, `.${string}` | `.${string}`[]>
}

export interface FilePickerOptions {
  types?: FilePickerAcceptType[]
  multiple?: boolean
  excludeAcceptAllOption?: boolean
}