/**
 * SecureKeyManager
 * 管理本地密钥文件的句柄，实现"用完即删"的零持久化安全策略。
 */

import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_NAMES,
  MEMORY_OVERWRITE_CHAR,
  EMPTY_STRING,
} from './SecureApiKeyInput.constants'
import { getFilePickerOptions } from './SecureApiKeyInput.guard'
import { checkFileSystemAPISupport, verifyPermission } from './SecureKeyManager.utils'
import type { KeyRequestFunction } from './SecureApiKeyInput.types'

class SecureKeyManager {
  private _fileHandle: FileSystemFileHandle | null = null
  private readonly _isSupported: boolean

  constructor() {
    // 检测 File System Access API 支持
    this._isSupported = checkFileSystemAPISupport()
  }

  /**
   * 获取 API 支持状态
   */
  get isSupported(): boolean {
    return this._isSupported
  }

  /**
   * 步骤1: 用户点击按钮，授权并选择密钥文件
   * 即使选择后，我们也不读取内容，只持有文件的引用(Handle)
   */
  async selectKeyFile(): Promise<boolean> {
    if (!this._isSupported) {
      console.error(ERROR_MESSAGES.FILE_SYSTEM_API_NOT_SUPPORTED)
      return false
    }

    try {
      // showOpenFilePicker 必须由用户手势(点击)触发
      const filePickerOptions = getFilePickerOptions()
      const [handle] = await window.showOpenFilePicker!(filePickerOptions)
      
      this._fileHandle = handle
      console.warn(SUCCESS_MESSAGES.FILE_HANDLE_ACQUIRED)
      return true
    } catch (error: unknown) {
      if (error instanceof Error && error.name === ERROR_NAMES.ABORT_ERROR) {
        console.warn(ERROR_MESSAGES.USER_CANCELLED_FILE_SELECTION)
        return false
      }
      
      console.error(ERROR_MESSAGES.FILE_HANDLE_ACQUISITION_FAILED, error)
      return false
    }
  }


  /**
   * 步骤2: 执行受保护的请求
   * 这是整个流程中 Key 以明文存在的唯一时刻
   * @param requestFn - 使用密钥执行请求的函数
   */
  async executeWithKey<T>(requestFn: KeyRequestFunction<T>): Promise<T> {
    if (!this._fileHandle) {
      throw new Error(ERROR_MESSAGES.NO_KEY_FILE_SELECTED)
    }

    // 确保我们仍然拥有读取文件的权限
    const hasPermission = await verifyPermission(this._fileHandle)
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.FILE_READ_PERMISSION_DENIED)
    }

    let sensitiveKey: string | null = null // 敏感变量初始化

    try {
      // --- 危险区开始 (Key 进入内存) ---
      
      // 1. 从句柄实时读取文件
      const file = await this._fileHandle.getFile()
      sensitiveKey = await file.text()
      
      // 简单清洗 (去除换行/空格)
      sensitiveKey = sensitiveKey.trim()

      if (!sensitiveKey) {
        throw new Error(ERROR_MESSAGES.EMPTY_KEY_FILE)
      }

      // 2. 执行请求
      console.warn(SUCCESS_MESSAGES.KEY_EXECUTION_STARTED)
      const result = await requestFn(sensitiveKey)
      
      return result

    } catch (error) {
      throw error
    } finally {
      // --- 危险区结束 (清理现场) ---
      
      // 3. 显式销毁 Key
      // 虽然函数结束会让变量脱离作用域，但显式赋值为 null 
      // 可以防止闭包意外捕获，并提示 V8 尽快回收
      if (sensitiveKey !== null) {
        // 覆盖内存中的密钥数据
        const overwriteLength = sensitiveKey.length
        sensitiveKey = MEMORY_OVERWRITE_CHAR.repeat(overwriteLength)
        sensitiveKey = null
      }
      
      console.warn(SUCCESS_MESSAGES.KEY_MEMORY_CLEARED)
    }
  }
  
  /**
   * 检查是否已选择密钥文件
   */
  hasKeyFile(): boolean {
    return this._fileHandle !== null
  }

  /**
   * 获取密钥文件名（用于显示）
   */
  async getFileName(): Promise<string> {
    if (!this._fileHandle) {
      return EMPTY_STRING
    }
    
    try {
      return this._fileHandle.name
    } catch (error) {
      console.error(ERROR_MESSAGES.GET_FILE_NAME_FAILED, error)
      return EMPTY_STRING
    }
  }

  /**
   * 可选: 如果用户登出，销毁句柄
   */
  clearSession(): void {
    this._fileHandle = null
    console.warn(SUCCESS_MESSAGES.KEY_HANDLE_CLEARED)
  }
}

// 导出单例实例
export const secureKeyManager = new SecureKeyManager()