/**
 * 程序化纹理模式 - 辅助函数
 */

import { dataURLToBlob } from './imports'
import type { ProjectStateActions } from './imports'
import { generateProceduralTextureFileName } from './templates'

/**
 * 持久化程序化纹理为项目
 */
export async function persistProceduralTexture(
    textureDataUrl: string | null,
    projectActions: ProjectStateActions,
    logMessages: { noTexture: string; saved: string }
): Promise<boolean> {
    if (!textureDataUrl) {
        console.warn(logMessages.noTexture)
        return false
    }

    // 将 DataURL 转换为 File 对象
    const blob = dataURLToBlob(textureDataUrl)
    const timestamp = Date.now()
    const fileName = generateProceduralTextureFileName(timestamp)
    const file = new File([blob], fileName, { type: blob.type })

    // 创建新项目
    await projectActions.createProject(file)
    
    console.warn(logMessages.saved)
    return true
}
