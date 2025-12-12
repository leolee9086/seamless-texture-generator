/**
 * SecureKeyManager 相关工具函数
 */

import {
  ERROR_MESSAGES,
  PERMISSION_MODE,
  PERMISSION_STATE,
} from './SecureApiKeyInput.constants'

/**
 * 检测 File System Access API 是否支持
 */
export function checkFileSystemAPISupport(): boolean {
  return !!(
    window.showOpenFilePicker &&
    window.FileSystemFileHandle &&
    window.FileSystemDirectoryHandle
  )
}

/**
 * 检查并请求读取权限
 * 浏览器可能在某些情况下要求重新确认权限
 */
export async function verifyPermission(handle: FileSystemFileHandle, withWrite = false): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = { 
    mode: withWrite ? PERMISSION_MODE.READWRITE : PERMISSION_MODE.READ 
  }
  
  try {
    // 检查当前权限状态
    if ((await handle.queryPermission(options)) === PERMISSION_STATE.GRANTED) {
      return true
    }
    
    // 如果没有权限，请求权限
    if ((await handle.requestPermission(options)) === PERMISSION_STATE.GRANTED) {
      return true
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.PERMISSION_VERIFICATION_FAILED, error)
  }
  
  return false
}