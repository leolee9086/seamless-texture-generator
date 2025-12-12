import type { ClarityParams } from './imports'
import {
    FILE_NAME_TEMPLATE,
    TIMESTAMP_PATTERN,
    TIMESTAMP_REPLACEMENT,
    JSON_MIME_TYPE
} from './exportParams.constants'

/**
 * 导出清晰度参数到JSON文件
 * @param clarityParams 清晰度参数
 */
export const exportParams = (clarityParams: ClarityParams): void => {
    const paramsData = JSON.stringify(clarityParams, null, 2)
    const blob = new Blob([paramsData], { type: JSON_MIME_TYPE })
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    
    // 生成带时间戳的文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(TIMESTAMP_PATTERN, TIMESTAMP_REPLACEMENT)
    const fileName = FILE_NAME_TEMPLATE.replace('{timestamp}', timestamp)
    downloadLink.download = fileName
    
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(url)
}